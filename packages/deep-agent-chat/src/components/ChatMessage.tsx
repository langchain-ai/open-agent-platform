"use client";

import React, { useMemo, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { SubAgentIndicator } from "./SubAgentIndicator";
import { ToolCallBox } from "./ToolCallBox";
import { MarkdownContent } from "./MarkdownContent";
import type { SubAgent, ToolCall } from "../types";
import { Message } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent } from "../utils";
import { cn } from "../lib/utils";

interface ChatMessageProps {
  message: Message;
  toolCalls: ToolCall[];
  onRestartFromAIMessage: (message: Message) => void;
  onRestartFromSubTask: (toolCallId: string) => void;
  debugMode?: boolean;
  isLastMessage?: boolean;
  isLoading?: boolean;
}

export const ChatMessage = React.memo<ChatMessageProps>(
  ({
    message,
    toolCalls,
    onRestartFromAIMessage,
    onRestartFromSubTask,
    debugMode,
    isLastMessage,
    isLoading,
  }) => {
    const isUser = message.type === "human";
    const isAIMessage = message.type === "ai";
    const messageContent = extractStringFromMessageContent(message);
    const hasContent = messageContent && messageContent.trim() !== "";
    const hasToolCalls = toolCalls.length > 0;
    const subAgents = useMemo(() => {
      return toolCalls
        .filter((toolCall: ToolCall) => {
          return (
            toolCall.name === "task" &&
            toolCall.args["subagent_type"] &&
            toolCall.args["subagent_type"] !== "" &&
            toolCall.args["subagent_type"] !== null
          );
        })
        .map((toolCall: ToolCall) => {
          return {
            id: toolCall.id,
            name: toolCall.name,
            subAgentName: String(toolCall.args["subagent_type"] || ""),
            input: toolCall.args,
            output: toolCall.result ? { result: toolCall.result } : undefined,
            status: toolCall.status,
          } as SubAgent;
        });
    }, [toolCalls]);

    const [expandedSubAgents, setExpandedSubAgents] = useState<
      Record<string, boolean>
    >({});
    const isSubAgentExpanded = useCallback(
      (id: string) => expandedSubAgents[id] ?? true,
      [expandedSubAgents],
    );
    const toggleSubAgent = useCallback((id: string) => {
      setExpandedSubAgents((prev) => ({
        ...prev,
        [id]: prev[id] === undefined ? false : !prev[id],
      }));
    }, []);

    return (
      <div
        className={cn(
          "flex w-full max-w-full overflow-x-hidden",
          isUser && "flex-row-reverse",
        )}
      >
        <div className="max-w-[70%] min-w-0 flex-shrink-0">
          {(hasContent || debugMode) && (
            <div className={cn("relative flex items-end gap-0")}>
              <div
                className={cn(
                  "mt-4 overflow-hidden break-words",
                  isUser
                    ? "text-foreground font-sans"
                    : "text-foreground p-3 font-sans",
                )}
                style={
                  isUser
                    ? {
                        borderRadius: "999px",
                        background: "#F4F3FF",
                        padding: "12px 16px",
                        color: "#1A1A1E",
                        fontSize: "14px",
                        fontStyle: "normal",
                        fontWeight: "400",
                        lineHeight: "150%",
                      }
                    : {
                        borderRadius: "12px",
                        background: "#F4F4F5",
                        color: "#1A1A1E",
                        fontSize: "14px",
                        fontStyle: "normal",
                        fontWeight: "400",
                        lineHeight: "150%",
                      }
                }
              >
                {isUser ? (
                  <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap">
                    {messageContent}
                  </p>
                ) : hasContent ? (
                  <MarkdownContent content={messageContent} />
                ) : debugMode ? (
                  <p className="m-0 text-xs whitespace-nowrap italic">
                    Empty Message
                  </p>
                ) : null}
              </div>
              {debugMode && isAIMessage && !(isLastMessage && isLoading) && (
                <button
                  onClick={() => onRestartFromAIMessage(message)}
                  className="absolute right-1 bottom-1 rounded-full bg-black/10 p-1 transition-colors duration-200 hover:bg-black/20"
                  style={{ transform: "scaleX(-1)" }}
                >
                  <RotateCcw className="h-3 w-3 text-gray-600" />
                </button>
              )}
            </div>
          )}
          {hasToolCalls && (
            <div className="mt-4 flex w-fit max-w-full flex-col">
              {toolCalls.map((toolCall: ToolCall) => {
                if (toolCall.name === "task") return null;
                return (
                  <ToolCallBox
                    key={toolCall.id}
                    toolCall={toolCall}
                  />
                );
              })}
            </div>
          )}
          {!isUser && subAgents.length > 0 && (
            <div className="flex w-fit max-w-full flex-col gap-4">
              {subAgents.map((subAgent) => (
                <div
                  key={subAgent.id}
                  className="flex w-full flex-col gap-2"
                >
                  <div className="flex items-end gap-2">
                    <div className={"w-[calc(100%-100px)]"}>
                      <SubAgentIndicator
                        subAgent={subAgent}
                        onClick={() => toggleSubAgent(subAgent.id)}
                      />
                    </div>
                    <div className="relative h-full min-h-[40px] w-[72px] flex-shrink-0">
                      {debugMode && subAgent.status === "completed" && (
                        <button
                          onClick={() => onRestartFromSubTask(subAgent.id)}
                          className="absolute right-1 bottom-1 rounded-full bg-black/10 p-1 transition-colors duration-200 hover:bg-black/20"
                          style={{ transform: "scaleX(-1)" }}
                        >
                          <RotateCcw className="h-3 w-3 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  {isSubAgentExpanded(subAgent.id) && (
                    <div className="w-full max-w-full">
                      <div className="bg-surface border-border-light rounded-md border p-4">
                        <h4 className="text-primary/70 mb-2 text-xs font-semibold tracking-wider uppercase">
                          Input
                        </h4>
                        <div className="mb-4">
                          <MarkdownContent
                            content={
                              typeof subAgent.input === "string"
                                ? subAgent.input
                                : subAgent.input.description &&
                                    typeof subAgent.input.description ===
                                      "string"
                                  ? subAgent.input.description
                                  : subAgent.input.prompt &&
                                      typeof subAgent.input.prompt === "string"
                                    ? subAgent.input.prompt
                                    : JSON.stringify(subAgent.input, null, 2)
                            }
                          />
                        </div>
                        {subAgent.output && (
                          <>
                            <h4 className="text-primary/70 mb-2 text-xs font-semibold tracking-wider uppercase">
                              Output
                            </h4>
                            <MarkdownContent
                              content={
                                typeof subAgent.output === "string"
                                  ? subAgent.output
                                  : subAgent.output.result &&
                                      typeof subAgent.output.result === "string"
                                    ? subAgent.output.result
                                    : JSON.stringify(subAgent.output, null, 2)
                              }
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ChatMessage.displayName = "ChatMessage";
