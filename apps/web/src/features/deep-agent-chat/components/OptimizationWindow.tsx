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
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useStream } from "@langchain/langgraph-sdk/react";
import { createClient, getOptimizerClient } from "@/lib/client";
import { Assistant, type Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { prepareOptimizerMessage } from "../utils";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";
import { useAuthContext } from "@/providers/Auth";

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
    const optimizerClient = useMemo(() => getOptimizerClient(), []);

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
      client: optimizerClient,
      threadId: optimizerThreadId ?? null,
      assistantId: "optimizer", // TODO: change to the optimizer assistant id
      onFinish: onFinish,
      onThreadId: setOptimizerThreadId,
      defaultHeaders: {
        "x-auth-scheme": "langsmith",
      },
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
          Math.min(textareaRef.current.scrollHeight, 120) + "px";
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
            "absolute right-0 bottom-0 left-0 z-10 flex flex-col overflow-hidden",
            isExpanded ? "h-1/2" : "h-12",
          )}
          style={{
            backgroundColor: "var(--color-surface)",
            border: "2px solid var(--color-primary)",
            borderRadius: "10px 10px 0 0",
            transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className="relative flex items-center overflow-hidden"
            style={{
              height: "48px",
              minHeight: "48px",
              backgroundColor: "var(--color-primary)",
              borderRadius: "8px 8px 0 0",
              padding: 0,
              margin: 0,
              border: "none",
            }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex h-full flex-1 cursor-pointer items-center justify-between"
                    style={{
                      paddingLeft: "16px",
                      paddingRight: "16px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={onToggle}
                    disabled={!optimizerClient}
                    aria-label={
                      isExpanded
                        ? "Collapse Training Mode"
                        : "Expand Training Mode"
                    }
                  >
                    <span className="font-medium">
                      {optimizerClient
                        ? "Deep Agent Optimizer"
                        : "(Disabled) Deep Agent Optimizer"}
                    </span>
                    {isExpanded ? (
                      <X
                        size={16}
                        className="text-white/80 transition-transform duration-200 ease-in-out hover:text-white"
                      />
                    ) : (
                      optimizerClient && (
                        <Expand
                          size={16}
                          className="text-white/80 transition-transform duration-200 ease-in-out hover:text-white"
                        />
                      )
                    )}
                  </button>
                </TooltipTrigger>
                {!optimizerClient && (
                  <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                      side="bottom"
                      sideOffset={5}
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "white",
                        border: "none",
                        fontSize: "12px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        zIndex: 50,
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        Set Optimizer Agent Environment Variables in FE
                        Deployment
                      </p>
                      <TooltipPrimitive.Arrow
                        style={{
                          fill: "var(--color-primary)",
                          color: "var(--color-primary)",
                        }}
                      />
                    </TooltipPrimitive.Content>
                  </TooltipPrimitive.Portal>
                )}
              </Tooltip>
            </TooltipProvider>
            {isExpanded && displayMessages.length > 0 && (
              <button
                className="absolute flex cursor-pointer items-center justify-center"
                style={{
                  right: "48px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "6px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.7)",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                  zIndex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }}
                onClick={handleClear}
                aria-label="Clear conversation"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div
            className={cn(
              "flex flex-1 flex-col",
              isExpanded ? "opacity-100" : "opacity-0",
            )}
            style={{
              transition: "opacity 0.3s ease 0.1s",
            }}
          >
            <div
              className="flex flex-1 flex-col overflow-hidden"
              style={{ backgroundColor: "var(--color-background)" }}
            >
              <div
                className="flex flex-1 flex-col overflow-hidden"
                style={{
                  padding: 0,
                  backgroundColor: "var(--color-background)",
                }}
              >
                <div
                  className="flex-1 overflow-hidden"
                  style={{
                    margin: 0,
                    backgroundColor: "var(--color-background)",
                    border: "none",
                  }}
                >
                  <div
                    className="flex h-full flex-col overflow-y-auto"
                    style={{
                      padding: "16px",
                      gap: "12px",
                    }}
                  >
                    {displayMessages.map((message, index) => {
                      if (isUserMessage(message)) {
                        return (
                          <div
                            key={`user-${index}`}
                            className="flex justify-end"
                            style={{ marginBottom: "8px" }}
                          >
                            <div
                              className="break-words text-white"
                              style={{
                                backgroundColor: "var(--color-user-message)",
                                padding: "10px 14px",
                                borderRadius: "16px",
                                borderBottomRightRadius: "4px",
                                maxWidth: "80%",
                                fontSize: "14px",
                                lineHeight: "1.4",
                              }}
                            >
                              {message.content}
                            </div>
                          </div>
                        );
                      } else if (isOptimizerMessage(message)) {
                        return (
                          <div
                            key={message.id}
                            className="flex justify-start"
                            style={{ marginBottom: "8px" }}
                          >
                            <button
                              className="flex cursor-pointer items-center"
                              style={{
                                gap: "8px",
                                padding: "12px 16px",
                                border:
                                  message.status === "pending"
                                    ? "1px solid rgba(251, 191, 36, 0.3)"
                                    : message.status === "approved"
                                      ? "1px solid rgba(34, 197, 94, 0.3)"
                                      : "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "all 0.2s",
                                maxWidth: "80%",
                                backgroundColor:
                                  message.status === "pending"
                                    ? "rgba(251, 191, 36, 0.1)"
                                    : message.status === "approved"
                                      ? "rgba(34, 197, 94, 0.1)"
                                      : "rgba(239, 68, 68, 0.1)",
                                color:
                                  message.status === "pending"
                                    ? "#d97706"
                                    : message.status === "approved"
                                      ? "#059669"
                                      : "#dc2626",
                              }}
                              onMouseEnter={(e) => {
                                if (!e.currentTarget.disabled) {
                                  e.currentTarget.style.backgroundColor =
                                    message.status === "pending"
                                      ? "rgba(251, 191, 36, 0.2)"
                                      : message.status === "approved"
                                        ? "rgba(34, 197, 94, 0.2)"
                                        : "rgba(239, 68, 68, 0.2)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  message.status === "pending"
                                    ? "rgba(251, 191, 36, 0.1)"
                                    : message.status === "approved"
                                      ? "rgba(34, 197, 94, 0.1)"
                                      : "rgba(239, 68, 68, 0.1)";
                              }}
                              onClick={() =>
                                handleOptimizerMessageClick(message)
                              }
                              disabled={message.status !== "pending"}
                            >
                              <span
                                style={{ fontSize: "16px", fontWeight: "bold" }}
                              >
                                {message.status === "approved" && "✓"}
                                {message.status === "rejected" && "✗"}
                                {message.status === "pending" && ""}
                              </span>
                              <span style={{ fontWeight: "500" }}>
                                {message.status === "approved" &&
                                  "Configuration Approved"}
                                {message.status === "rejected" &&
                                  "Configuration Rejected"}
                                {message.status === "pending" &&
                                  "Configuration Pending Review"}
                              </span>
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })}
                    {isLoading && (
                      <div
                        className="flex justify-start"
                        style={{ marginBottom: "8px" }}
                      >
                        <div
                          className="flex items-center"
                          style={{
                            gap: "8px",
                            padding: "12px 16px",
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "16px",
                            borderBottomLeftRadius: "4px",
                            color: "var(--color-text-secondary)",
                            fontSize: "14px",
                            fontStyle: "italic",
                          }}
                        >
                          <Loader2
                            size={16}
                            className="animate-spin"
                            style={{ color: "var(--color-primary)" }}
                          />
                          <span>Analyzing feedback...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="flex items-end"
              style={{
                backgroundColor: "var(--color-surface)",
                borderTop: "2px solid var(--color-border)",
                padding: "12px 16px",
                minHeight: "auto",
              }}
            >
              <form
                className="w-full"
                onSubmit={handleSubmitFeedback}
              >
                <div
                  className="flex items-end"
                  style={{
                    gap: "10px",
                    backgroundColor: "var(--color-background)",
                    border: "2px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "10px",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    if (e.currentTarget.contains(e.target)) {
                      e.currentTarget.style.borderColor =
                        "var(--color-primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 2px rgba(28, 60, 60, 0.1)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    className="flex-1 resize-none overflow-y-auto outline-none"
                    style={{
                      padding: "8px 12px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--color-text-primary)",
                      fontSize: "15px",
                      fontFamily: "inherit",
                      lineHeight: "24px",
                      minHeight: "30px",
                      maxHeight: "120px",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onFocus={(e) => {
                      e.target.style.setProperty(
                        "--placeholder-color",
                        "var(--color-text-tertiary)",
                      );
                    }}
                    onBlur={(e) => {
                      e.target.style.setProperty(
                        "--placeholder-color",
                        "var(--color-text-tertiary)",
                      );
                    }}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your feedback..."
                    aria-label="Feedback input"
                    rows={1}
                  />
                  <button
                    type="submit"
                    className="flex flex-shrink-0 cursor-pointer items-center justify-center self-end"
                    style={{
                      padding: "10px",
                      backgroundColor: "var(--color-primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      transition: "all 0.2s",
                      opacity: feedbackInput.trim() ? 1 : 0.4,
                      cursor: feedbackInput.trim() ? "pointer" : "not-allowed",
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.opacity = "0.9";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = feedbackInput.trim()
                        ? "1"
                        : "0.4";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onMouseDown={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = "scale(0.95)";
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }
                    }}
                    disabled={!feedbackInput.trim()}
                    aria-label="Send feedback"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {isDiffDialogOpen && selectedOptimizerMessage && (
          <div
            className="fixed top-0 right-0 bottom-0 left-0 flex animate-[fadeIn_0.2s_ease] items-center justify-center"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
            onClick={handleCloseDiffDialog}
          >
            <div
              className="flex animate-[slideIn_0.3s_cubic-bezier(0.4,0,0.2,1)] flex-col"
              style={{
                backgroundColor: "var(--color-background)",
                borderRadius: "12px",
                width: "95%",
                maxWidth: "1200px",
                maxHeight: "85vh",
                boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between"
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "12px 12px 0 0",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "var(--color-text-primary)",
                  }}
                >
                  Configuration Changes
                </h2>
                <button
                  className="flex cursor-pointer items-center justify-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    color: "var(--color-text-secondary)",
                    fontSize: "20px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-border-light)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                    e.currentTarget.style.transform = "rotate(90deg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.transform = "rotate(0deg)";
                  }}
                  onClick={handleCloseDiffDialog}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
              <div
                className="flex-1 overflow-y-auto"
                style={{
                  padding: "24px",
                  color: "var(--color-text-primary)",
                  lineHeight: "1.6",
                }}
              >
                <div
                  className="grid h-full grid-cols-2"
                  style={{ gap: "24px" }}
                >
                  <div className="flex flex-col">
                    <h3
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "var(--color-text-primary)",
                        paddingBottom: "8px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      Current Configuration
                    </h3>
                    <div className="flex-1 overflow-auto">
                      <div
                        style={{
                          backgroundColor: "#0d1117",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          padding: "16px",
                          fontFamily:
                            '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: "#e6edf3",
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
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
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "var(--color-text-primary)",
                        paddingBottom: "8px",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      Proposed Configuration
                    </h3>
                    <div className="flex-1 overflow-auto">
                      <div
                        style={{
                          backgroundColor: "#0d1117",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          padding: "16px",
                          fontFamily:
                            '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: "#e6edf3",
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
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
                className="flex justify-end"
                style={{
                  gap: "12px",
                  padding: "20px 24px",
                  borderTop: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "0 0 12px 12px",
                }}
              >
                <button
                  className="cursor-pointer"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-border-light)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                    e.currentTarget.style.borderColor =
                      "var(--color-text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(1px)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  onClick={handleReject}
                >
                  Reject Changes
                </button>
                <button
                  className="cursor-pointer"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#047857";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#059669";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
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
