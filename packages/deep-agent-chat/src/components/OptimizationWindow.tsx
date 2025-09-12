"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { X, Loader2, ChevronUp } from "lucide-react";
import * as Diff from "diff";
import { useStream } from "@langchain/langgraph-sdk/react";
import { useClients } from "../providers/ClientProvider";
import { Assistant, type Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { prepareOptimizerMessage, formatConversationForLLM } from "../utils";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import AutoGrowTextarea from "./ui/auto-grow-textarea";
import * as yaml from "js-yaml";
import { useQueryState } from "nuqs";

type StateType = {
  messages: Message[];
  agent_messages: Message[];
  files: Record<string, string>;
};

type UserMessage = {
  type: "user";
  content: string;
};

type OptimizerMessage = {
  type: "optimizer";
  id: string;
  status: "approved" | "rejected" | "pending";
  old_config: Record<string, unknown>;
  new_config: Record<string, unknown>;
};

interface OptimizationWindowProps {
  threadId: string | null;
  deepAgentMessages: Message[];
  isExpanded: boolean;
  onToggle: () => void;
  activeAssistant: Assistant | null;
  setActiveAssistant: (assistant: Assistant | null) => void;
  setAssistantError: (error: string | null) => void;
}

type DisplayMessage = UserMessage | OptimizerMessage;

export const OptimizationWindow = React.memo<OptimizationWindowProps>(
  ({
    deepAgentMessages,
    isExpanded,
    onToggle: _onToggle,
    activeAssistant,
    setActiveAssistant,
    setAssistantError,
  }) => {
    const [threadId] = useQueryState("threadId");
    const { client, optimizerClient } = useClients();
    const [optimizerThreadId, setOptimizerThreadId] = useState<string | null>(
      null,
    );
    const [feedbackInput, setFeedbackInput] = useState("");
    const [isDiffDialogOpen, setIsDiffDialogOpen] = useState(false);
    const [selectedOptimizerMessage, setSelectedOptimizerMessage] =
      useState<OptimizerMessage | null>(null);
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>(
      [],
    );
    const optimizerMessagesEndRef = useRef<HTMLDivElement>(null);

    const onFinish = useCallback(
      (state: { values: { files: { [key: string]: string } } }) => {
        const optimizerMessage: OptimizerMessage = {
          type: "optimizer",
          id: uuidv4(),
          status: "pending",
          old_config: activeAssistant?.config.configurable || {},
          new_config: yaml.load(state.values.files["config.yaml"]) as Record<
            string,
            unknown
          >,
        };
        setDisplayMessages((prev) => [...prev, optimizerMessage]);
      },
      [activeAssistant],
    );

    const stream = useStream<StateType>({
      client: optimizerClient ?? undefined,
      threadId: optimizerThreadId ?? null,
      assistantId: "optimizer", // TODO: change to the optimizer assistant id
      onFinish: onFinish,
      onThreadId: setOptimizerThreadId,
    });

    const isLoading = stream.isLoading;

    const handleSubmitFeedback = useCallback(
      (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }
        if (isLoading) return;

        // Silent early return if input is empty or only whitespace
        if (!feedbackInput.trim()) return;

        setFeedbackInput("");
        setDisplayMessages((prev) => [
          ...prev,
          { type: "user", content: feedbackInput },
        ]);

        const humanMessage: Message = {
          id: uuidv4(),
          type: "human",
          content: prepareOptimizerMessage(feedbackInput),
        };

        stream.submit({
          messages: [humanMessage],
          files: {
            "config.yaml": yaml.dump(
              activeAssistant?.config.configurable || {},
            ),
            "conversation.txt": formatConversationForLLM(deepAgentMessages),
          },
        });
      },
      [feedbackInput, stream, activeAssistant, deepAgentMessages, isLoading],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          if (isLoading) return;
          e.preventDefault();
          handleSubmitFeedback();
        }
      },
      [handleSubmitFeedback, isLoading],
    );

    const handleClear = useCallback(() => {
      stream.stop();
      setOptimizerThreadId(null);
      setFeedbackInput("");
      setDisplayMessages([]);
    }, [stream, setOptimizerThreadId, setFeedbackInput, setDisplayMessages]);

    // Clear the optimizer window when the threadId is cleared
    const prevThreadIdRef = useRef<string | null>(threadId);

    useEffect(() => {
      if (prevThreadIdRef.current !== null && threadId === null) {
        handleClear();
      }
      prevThreadIdRef.current = threadId;
    }, [threadId, handleClear]);

    const isUserMessage = (message: DisplayMessage): message is UserMessage => {
      return message.type === "user";
    };

    const isOptimizerMessage = (
      message: DisplayMessage,
    ): message is OptimizerMessage => {
      return message.type === "optimizer";
    };

    const handleOptimizerMessageClick = useCallback(
      (message: OptimizerMessage) => {
        if (message.status === "pending") {
          setSelectedOptimizerMessage(message);
          setIsDiffDialogOpen(true);
        }
      },
      [],
    );

    const refreshActiveAssistant = useCallback(async () => {
      setAssistantError(null);

      if (!activeAssistant || !client) {
        setActiveAssistant(null);
        return;
      }

      try {
        const assistant = await client.assistants.get(
          activeAssistant.assistant_id,
        );

        setActiveAssistant(assistant);
        toast.dismiss();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        setActiveAssistant(null);
        setAssistantError(errorMessage);

        toast.dismiss();
        toast.error("Failed to load assistant", {
          description: `Could not connect to assistant: ${errorMessage}`,
          duration: 50000,
        });
      }
    }, [client, activeAssistant, setActiveAssistant, setAssistantError]);

    const handleApprove = useCallback(async () => {
      if (selectedOptimizerMessage) {
        setDisplayMessages((prev) =>
          prev.map((msg) =>
            isOptimizerMessage(msg) && msg.id === selectedOptimizerMessage.id
              ? { ...msg, status: "approved" as const }
              : msg,
          ),
        );

        handleClear();

        if (activeAssistant && client) {
          await client.assistants.update(activeAssistant.assistant_id, {
            metadata: activeAssistant.metadata,
            config: {
              configurable: selectedOptimizerMessage.new_config,
            },
          });
          await refreshActiveAssistant();
        }

        setIsDiffDialogOpen(false);
        setSelectedOptimizerMessage(null);
      }
    }, [
      selectedOptimizerMessage,
      handleClear,
      activeAssistant,
      refreshActiveAssistant,
      client,
    ]);

    const handleReject = useCallback(() => {
      if (selectedOptimizerMessage) {
        setDisplayMessages((prev) =>
          prev.map((msg) =>
            isOptimizerMessage(msg) && msg.id === selectedOptimizerMessage.id
              ? { ...msg, status: "rejected" as const }
              : msg,
          ),
        );
        setIsDiffDialogOpen(false);
        setSelectedOptimizerMessage(null);
      }
    }, [selectedOptimizerMessage]);

    const handleCloseDiffDialog = useCallback(() => {
      setIsDiffDialogOpen(false);
      setSelectedOptimizerMessage(null);
    }, []);

    const createSideBySideDiff = useCallback(
      (
        oldConfig: Record<string, unknown>,
        newConfig: Record<string, unknown>,
      ) => {
        const oldStr = yaml.dump(oldConfig, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: true,
        });
        const newStr = yaml.dump(newConfig, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
          sortKeys: true,
        });

        const oldLines = oldStr
          .split("\n")
          .filter((line, i, arr) => i < arr.length - 1 || line !== "");
        const newLines = newStr
          .split("\n")
          .filter((line, i, arr) => i < arr.length - 1 || line !== "");

        // Get line-level diff
        const lineDiff = Diff.diffLines(oldStr, newStr);

        const result: {
          lineNumber: number;
          oldLine: string;
          newLine: string;
          hasChanges: boolean;
        }[] = [];
        let oldLineIndex = 0;
        let newLineIndex = 0;

        lineDiff.forEach((part) => {
          const lines = part.value
            .split("\n")
            .filter((line, i, arr) => i < arr.length - 1 || line !== "");

          if (part.removed) {
            // These lines exist only in the old version
            lines.forEach((line) => {
              const escapedLine = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              result.push({
                lineNumber: result.length + 1,
                oldLine: `<span class="bg-red-50 text-red-600 px-1 py-0.5 rounded font-semibold">${escapedLine}</span>`,
                newLine: "",
                hasChanges: true,
              });
              oldLineIndex++;
            });
          } else if (part.added) {
            // These lines exist only in the new version
            lines.forEach((line) => {
              const escapedLine = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              result.push({
                lineNumber: result.length + 1,
                oldLine: "",
                newLine: `<span class="bg-green-50 text-green-600 px-1 py-0.5 rounded font-semibold">${escapedLine}</span>`,
                hasChanges: true,
              });
              newLineIndex++;
            });
          } else {
            // These lines are unchanged, but we still want to check for word-level differences
            lines.forEach((line) => {
              const oldLine = oldLines[oldLineIndex] || line;
              const newLine = newLines[newLineIndex] || line;

              let oldHighlighted = oldLine
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              let newHighlighted = newLine
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              let hasChanges = false;

              // Check if the lines are actually different (they should be the same in unchanged sections)
              if (oldLine !== newLine) {
                // Apply word-level diff for modified lines
                const wordDiff = Diff.diffWords(oldLine, newLine);

                oldHighlighted = "";
                newHighlighted = "";

                wordDiff.forEach((wordPart) => {
                  if (wordPart.removed) {
                    const escapedValue = wordPart.value
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
                    oldHighlighted += `<span class="bg-red-50 text-red-600 px-1 py-0.5 rounded font-semibold">${escapedValue}</span>`;
                    hasChanges = true;
                  } else if (wordPart.added) {
                    const escapedValue = wordPart.value
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
                    newHighlighted += `<span class="bg-green-50 text-green-600 px-1 py-0.5 rounded font-semibold">${escapedValue}</span>`;
                    hasChanges = true;
                  } else {
                    const escapedValue = wordPart.value
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
                    oldHighlighted += escapedValue;
                    newHighlighted += escapedValue;
                  }
                });
              }

              result.push({
                lineNumber: result.length + 1,
                oldLine: oldHighlighted,
                newLine: newHighlighted,
                hasChanges,
              });

              oldLineIndex++;
              newLineIndex++;
            });
          }
        });

        return result;
      },
      [],
    );

    useEffect(() => {
      if (!displayMessages.length) return;
      optimizerMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [displayMessages]);

    return (
      <>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            isExpanded ? "" : "",
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-pretty-auto min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 bg-inherit p-4">
                {displayMessages.map((message, index) => {
                  if (isUserMessage(message)) {
                    return (
                      <div
                        key={`user-${index}`}
                        className="mb-2 ml-auto flex max-w-[80%] justify-end rounded-2xl bg-teal-700 px-3.5 py-2.5 text-sm break-words text-white"
                      >
                        {message.content}
                      </div>
                    );
                  } else if (isOptimizerMessage(message)) {
                    return (
                      <div
                        key={message.id}
                        className="mr-auto mb-2 flex justify-start"
                      >
                        <button
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out",
                            message.status === "pending" &&
                              "border-warning/30 bg-warning/10 text-warning-dark",
                            message.status === "approved" &&
                              "border-success/30 bg-success/10 text-success-dark",
                            !["pending", "approved"].includes(message.status) &&
                              "border-destructive/30 bg-destructive/10 text-destructive",
                          )}
                          onClick={() => handleOptimizerMessageClick(message)}
                          disabled={message.status !== "pending"}
                        >
                          <p className="text-lg font-bold">
                            {message.status === "approved" && "✓"}
                            {message.status === "rejected" && "✗"}
                            {message.status === "pending" && ""}
                          </p>
                          <p>
                            {message.status === "approved" &&
                              "Configuration Approved"}
                            {message.status === "rejected" &&
                              "Configuration Rejected"}
                            {message.status === "pending" &&
                              "Configuration Pending Review"}
                          </p>
                        </button>
                      </div>
                    );
                  }
                  return null;
                })}
                {isLoading && (
                  <div className="border-border mb-2 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm text-black/80 italic">
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    <p>Analyzing feedback...</p>
                  </div>
                )}
                <div ref={optimizerMessagesEndRef} />
              </div>
            </div>
            {displayMessages.length === 0 && (
              <div className="px-0 pb-2">
                <div className="font-inter rounded-xl bg-[#F4F4F5] p-4 text-sm leading-[150%] font-normal text-[#3F3F46]">
                  <p className="m-0">
                    Update your agent's goals, tools, instructions, or
                    sub-agents anytime.
                  </p>
                  <p className="m-0 mt-3">
                    Just tell me what you'd like to change — for example:
                  </p>
                  <p className="m-0">
                    'Add LinkedIn as a tool' or 'Update the agent's tone to be
                    more casual.'
                  </p>
                </div>
              </div>
            )}
            <form
              className="border-border focus-within:border-primary focus-within:ring-primary mt-2 mb-0 flex max-h-38 flex-shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-200 ease-in-out focus-within:ring-offset-2"
              onSubmit={handleSubmitFeedback}
            >
              <AutoGrowTextarea
                value={feedbackInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFeedbackInput(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Make changes to your agent"
                aria-label="Feedback input"
                excludeDefaultStyles
                className="w-full text-sm outline-none"
                maxRows={6}
              />
              <button
                type="submit"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white disabled:opacity-50"
                disabled={isLoading}
                aria-label="Submit agent changes"
              >
                <ChevronUp className="h-5 w-5 text-gray-700" />
              </button>
            </form>
          </div>
        </div>
        {isDiffDialogOpen && selectedOptimizerMessage && (
          <div
            className="fixed inset-0 z-[1000] flex animate-[fadeIn_0.2s_ease] items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={handleCloseDiffDialog}
          >
            <div
              className="flex max-h-[85vh] w-[95%] max-w-[1200px] animate-[slideIn_0.3s_cubic-bezier(0.4,0,0.2,1)] flex-col rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-border bg-card flex items-center justify-between rounded-t-xl border-b px-6 py-5">
                <h2 className="text-foreground m-0 text-lg font-semibold">
                  Configuration Changes
                </h2>
                <button
                  className="hover:bg-muted text-muted-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-xl transition-all duration-200 hover:rotate-90"
                  onClick={handleCloseDiffDialog}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="bg-background text-foreground flex-1 overflow-y-auto p-6 leading-relaxed">
                <div className="grid h-full grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <h3 className="border-border text-foreground m-0 mb-3 border-b pb-2 text-base font-semibold">
                      Current Configuration
                    </h3>
                    <div className="flex-1 overflow-auto">
                      <div className="border-border bg-muted/30 text-foreground overflow-auto rounded-lg border p-4 font-mono text-xs leading-normal break-words whitespace-pre-wrap">
                        {createSideBySideDiff(
                          selectedOptimizerMessage.old_config,
                          selectedOptimizerMessage.new_config,
                        ).map((line, index) => (
                          <div
                            key={`old-${index}`}
                            className={cn(
                              "min-h-[1.5em]",
                              line.hasChanges
                                ? "-mx-4 bg-white/[0.02] px-4"
                                : "",
                            )}
                            dangerouslySetInnerHTML={{ __html: line.oldLine }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="border-border text-foreground m-0 mb-3 border-b pb-2 text-base font-semibold">
                      Proposed Configuration
                    </h3>
                    <div className="flex-1 overflow-auto">
                      <div className="border-border bg-muted/30 text-foreground overflow-auto rounded-lg border p-4 font-mono text-xs leading-normal break-words whitespace-pre-wrap">
                        {createSideBySideDiff(
                          selectedOptimizerMessage.old_config,
                          selectedOptimizerMessage.new_config,
                        ).map((line, index) => (
                          <div
                            key={`new-${index}`}
                            className={cn(
                              "min-h-[1.5em]",
                              line.hasChanges
                                ? "-mx-4 bg-white/[0.02] px-4"
                                : "",
                            )}
                            dangerouslySetInnerHTML={{ __html: line.newLine }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-border bg-card flex justify-end gap-3 rounded-b-xl border-t px-6 py-5">
                <button
                  className="hover:bg-muted border-border text-muted-foreground cursor-pointer rounded-md border bg-transparent px-5 py-2.5 text-sm font-medium transition-all duration-200 active:translate-y-px"
                  onClick={handleReject}
                >
                  Reject Changes
                </button>
                <button
                  className="cursor-pointer rounded-md border-none bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-700 active:translate-y-0"
                  onClick={handleApprove}
                >
                  Approve Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

OptimizationWindow.displayName = "OptimizationWindow";
