"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Expand, X, Send, RotateCcw, Loader2 } from "lucide-react";
import * as Diff from "diff";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useStream } from "@langchain/langgraph-sdk/react";
import { createClient, getOptimizerClient } from "@/lib/client";
import { Assistant, type Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { prepareOptimizerMessage } from "../utils";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";
import { useAuthContext } from "@/providers/Auth";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";

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
  onAssistantUpdate: () => void;
}

type DisplayMessage = UserMessage | OptimizerMessage;

export const OptimizationWindow = React.memo<OptimizationWindowProps>(
  ({
    threadId,
    deepAgentMessages,
    isExpanded,
    onToggle,
    activeAssistant,
    onAssistantUpdate,
  }) => {
    const { session } = useAuthContext();

    const [deploymentId] = useQueryState("deploymentId");
    const [optimizerThreadId, setOptimizerThreadId] = useState<string | null>(
      null,
    );
    const [feedbackInput, setFeedbackInput] = useState("");
    const [isDiffDialogOpen, setIsDiffDialogOpen] = useState(false);
    const [selectedOptimizerMessage, setSelectedOptimizerMessage] =
      useState<OptimizerMessage | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>(
      [],
    );

    const deploymentClient = useMemo(() => {
      if (!deploymentId || !session?.accessToken) return null;
      return createClient(deploymentId, session.accessToken);
    }, [deploymentId, session]);

    const optimizerClient = useMemo(() => {
      if (!session?.accessToken) return null;
      return getOptimizerClient(session.accessToken);
    }, [session]);

    const onFinish = useCallback(
      (state: { values: { files: { [key: string]: string } } }) => {
        const optimizerMessage: OptimizerMessage = {
          type: "optimizer",
          id: uuidv4(),
          status: "pending",
          old_config: activeAssistant?.config.configurable || {},
          new_config: JSON.parse(state.values.files["config.json"]),
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
            "config.json": JSON.stringify(
              activeAssistant?.config.configurable || {},
              null,
              2,
            ),
            "conversation.json": JSON.stringify(deepAgentMessages, null, 2),
          },
        });
      },
      [feedbackInput, stream, activeAssistant, deepAgentMessages],
    );

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 112) + "px";
      }
    }, [feedbackInput]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmitFeedback();
        }
      },
      [handleSubmitFeedback],
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

    const handleApprove = useCallback(() => {
      if (selectedOptimizerMessage) {
        setDisplayMessages((prev) =>
          prev.map((msg) =>
            isOptimizerMessage(msg) && msg.id === selectedOptimizerMessage.id
              ? { ...msg, status: "approved" as const }
              : msg,
          ),
        );
        handleClear();
        if (activeAssistant && deploymentClient) {
          deploymentClient.assistants
            .update(activeAssistant.assistant_id, {
              config: {
                configurable: selectedOptimizerMessage.new_config,
              },
            })
            .then(() => {
              // Wait a bit for the update to propagate
              setTimeout(() => {
                onAssistantUpdate();
              }, 500);
            });
        }
        setIsDiffDialogOpen(false);
        setSelectedOptimizerMessage(null);
      }
    }, [
      selectedOptimizerMessage,
      handleClear,
      activeAssistant,
      onAssistantUpdate,
      deploymentClient,
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
        const oldStr = JSON.stringify(oldConfig, null, 2);
        const newStr = JSON.stringify(newConfig, null, 2);

        const oldLines = oldStr.split("\n");
        const newLines = newStr.split("\n");

        const maxLines = Math.max(oldLines.length, newLines.length);
        const result = [];

        for (let i = 0; i < maxLines; i++) {
          const oldLine = oldLines[i] || "";
          const newLine = newLines[i] || "";

          let oldHighlighted = oldLine;
          let newHighlighted = newLine;

          if (oldLine !== newLine) {
            const wordDiff = Diff.diffWords(oldLine, newLine);

            oldHighlighted = "";
            newHighlighted = "";

            wordDiff.forEach((part) => {
              if (part.removed) {
                oldHighlighted += `<span class="word-removed">${part.value}</span>`;
              } else if (part.added) {
                newHighlighted += `<span class="word-added">${part.value}</span>`;
              } else {
                oldHighlighted += part.value;
                newHighlighted += part.value;
              }
            });
          }

          result.push({
            lineNumber: i + 1,
            oldLine: oldHighlighted,
            newLine: newHighlighted,
            hasChanges: oldLine !== newLine,
          });
        }

        return result;
      },
      [],
    );

    return (
      <>
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-t-[10px] transition-[height] duration-400 ease-out",
            isExpanded ? "h-1/2" : "h-12",
          )}
        >
          <div className="bg-primary relative flex min-h-12 items-center overflow-hidden rounded-t-xl border-none">
            <Button
              onClick={onToggle}
              disabled={!optimizerClient}
              className="flex h-full flex-1 cursor-pointer items-center justify-between bg-transparent px-4 text-sm font-medium text-white/80 transition-colors duration-200 ease-in-out hover:bg-transparent hover:text-white"
            >
              {optimizerClient
                ? "Deep Agent Optimizer"
                : "(Disabled) Deep Agent Optimizer"}
            </Button>

            {isExpanded && displayMessages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="ml-auto bg-transparent text-white/80 transition-colors duration-200 hover:bg-transparent hover:text-white"
              >
                <RotateCcw size={16} />
              </Button>
            )}

            <TooltipIconButton
              onClick={onToggle}
              disabled={!optimizerClient}
              tooltip={
                !optimizerClient
                  ? "Set Optimizer Agent Environment Variables in FE Deployment"
                  : "Expand Optimizer"
              }
              className="cursor-pointer bg-transparent px-6 text-white/80 transition-transform duration-200 ease-in-out hover:bg-transparent hover:text-white"
            >
              {isExpanded ? (
                <X size={16} />
              ) : (
                optimizerClient && <Expand size={16} />
              )}
            </TooltipIconButton>
          </div>

          <div
            className={cn(
              "flex flex-1 flex-col transition-opacity delay-100 duration-300 ease-in-out",
              isExpanded ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="flex flex-1 flex-col overflow-hidden bg-inherit">
              <div className="flex-1 overflow-hidden">
                <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
                  {displayMessages.map((message, index) => {
                    if (isUserMessage(message)) {
                      return (
                        <div
                          key={`user-${index}`}
                          className="bg-user-message mb-2 ml-auto flex max-w-[80%] justify-end rounded-2xl px-3.5 py-2.5 text-sm break-words text-white"
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
                              "hover:bg-primary hover:text-primary-foreground flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out",
                              message.status === "pending" &&
                                "border-[#fbbf244d] bg-[#fbbf241a] text-[#d97706]",
                              message.status === "approved" &&
                                "border-[#22c55e4d] bg-[#22c55e1a] text-[#059669]",
                              !["pending", "approved"].includes(
                                message.status,
                              ) &&
                                "border-[#ef44444d] bg-[#ef44441a] text-[#dc2626]",
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
                </div>
              </div>
            </div>
            <form
              className="border-border focus-within:border-primary focus-within:ring-primary mx-2 mb-2 flex max-h-32 min-h-[44px] items-end gap-3 rounded-2xl border px-3 py-2 transition-colors duration-200 ease-in-out focus-within:ring-offset-2"
              onSubmit={handleSubmitFeedback}
            >
              <textarea
                ref={textareaRef}
                className="max-h-28 min-h-[28px] flex-1 resize-none overflow-y-auto text-sm outline-none"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your feedback..."
                aria-label="Feedback input"
              />
              <Button
                type="submit"
                size="icon"
                className="flex-shrink-0"
              >
                <Send size={14} />
              </Button>
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
              <div
                className="flex items-center justify-between rounded-t-xl border-b px-6 py-5"
                style={{
                  borderBottomColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <h2
                  className="m-0 text-lg font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Configuration Changes
                </h2>
                <button
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-xl transition-all duration-200 hover:rotate-90 hover:bg-gray-100 dark:hover:bg-gray-800"
                  style={{ color: "var(--color-text-secondary)" }}
                  onClick={handleCloseDiffDialog}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
              <div
                className="flex-1 overflow-y-auto bg-white p-6 leading-relaxed"
                style={{ color: "var(--color-text-primary)" }}
              >
                <div className="grid h-full grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <h3
                      className="m-0 mb-3 border-b pb-2 text-base font-semibold"
                      style={{
                        color: "var(--color-text-primary)",
                        borderBottomColor: "var(--color-border)",
                      }}
                    >
                      Current Configuration
                    </h3>
                    <div className="flex-1 overflow-auto">
                      <div
                        className="overflow-auto rounded-lg border p-4 font-mono text-xs leading-normal break-words whitespace-pre-wrap"
                        style={{
                          backgroundColor: "#0d1117",
                          borderColor: "var(--color-border)",
                          color: "#e6edf3",
                          fontFamily:
                            '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                        }}
                      >
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
                    <h3
                      className="m-0 mb-3 border-b pb-2 text-base font-semibold"
                      style={{
                        color: "var(--color-text-primary)",
                        borderBottomColor: "var(--color-border)",
                      }}
                    >
                      Proposed Configuration
                    </h3>
                    <div className="flex-1 overflow-auto">
                      <div
                        className="overflow-auto rounded-lg border p-4 font-mono text-xs leading-normal break-words whitespace-pre-wrap"
                        style={{
                          backgroundColor: "#0d1117",
                          borderColor: "var(--color-border)",
                          color: "#e6edf3",
                          fontFamily:
                            '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                        }}
                      >
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
              <div
                className="flex justify-end gap-3 rounded-b-xl border-t px-6 py-5"
                style={{
                  borderTopColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <button
                  className="cursor-pointer rounded-md border bg-transparent px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-gray-100 active:translate-y-px dark:hover:bg-gray-800"
                  style={{
                    color: "var(--color-text-secondary)",
                    borderColor: "var(--color-border)",
                  }}
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
