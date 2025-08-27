"use client";

import React, { useEffect, useMemo } from "react";
import { User, Bot } from "lucide-react";
import { SubAgentIndicator } from "./SubAgentIndicator";
import { ToolCallBox } from "./ToolCallBox";
import { MarkdownContent } from "./MarkdownContent";
import type { SubAgent, ToolCall } from "../types";
import { Message } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent } from "../utils";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  toolCalls: ToolCall[];
  showAvatar: boolean;
  onSelectSubAgent: (subAgent: SubAgent | null) => void;
  selectedSubAgent: SubAgent | null;
  onRestartFromAIMessage: (message: Message) => void;
  onRestartFromSubTask: (toolCallId: string) => void;
  debugMode?: boolean;
}

export const ChatMessage = React.memo<ChatMessageProps>(
  ({ message, toolCalls, showAvatar, onSelectSubAgent, selectedSubAgent, onRestartFromAIMessage, onRestartFromSubTask, debugMode }) => {
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

    const subAgentsString = useMemo(() => {
      return JSON.stringify(subAgents);
    }, [subAgents]);

    useEffect(() => {
      if (subAgents.some((subAgent) => subAgent.id === selectedSubAgent?.id)) {
        onSelectSubAgent(
          subAgents.find((subAgent) => subAgent.id === selectedSubAgent?.id)!,
        );
      }
    }, [selectedSubAgent, onSelectSubAgent, subAgentsString, subAgents]);

    return (
      <div
        className={cn(
          "flex w-full max-w-full gap-2 overflow-x-hidden",
          isUser && "flex-row-reverse",
        )}
      >
        <div
          className={cn(
            "mt-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            !showAvatar
              ? "bg-transparent"
              : isUser
                ? "bg-user-message"
                : "bg-avatar-bg",
          )}
        >
          {showAvatar &&
            (isUser ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Bot className="h-4 w-4 text-gray-500" />
            ))}
        </div>
        <div className="max-w-[70%] min-w-0 flex-shrink-0">
          {hasContent && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "mt-4 w-fit max-w-full overflow-hidden rounded-lg p-2 break-words",
                  isUser
                    ? "bg-user-message ml-auto text-white"
                    : "border-border bg-surface text-primary border",
                )}
              >
                {isUser ? (
                  <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap">
                    {messageContent}
                  </p>
                ) : (
                  <MarkdownContent content={messageContent} />
                )}
              </div>
              {debugMode && isAIMessage && (
                <button
                  onClick={() => onRestartFromAIMessage(message)}
                  className="mt-4 text-xs text-gray-400 bg-transparent hover:text-gray-600 transition-colors duration-200 whitespace-nowrap"
                >
                  Regenerate
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
                <div key={subAgent.id} className="flex items-center gap-2">
                  <SubAgentIndicator
                    subAgent={subAgent}
                    onClick={() => onSelectSubAgent(subAgent)}
                  />
                  {debugMode && subAgent.status === "completed" && (
                    <button
                      onClick={() => onRestartFromSubTask(subAgent.id)}
                      className="text-xs text-gray-400 bg-transparent hover:text-gray-600 transition-colors duration-200 whitespace-nowrap"
                    >
                      Regenerate
                    </button>
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
