import React, { useState, useMemo, useEffect, useRef } from "react";
import { HelpCircle, Send, X, Braces, Loader2 } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { useStream } from "@langchain/langgraph-sdk/react";
import { v4 as uuidv4 } from "uuid";
import type { Message, Assistant } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent } from "@/features/agent-chat/utils";
import { createClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import { useDeployment } from "@/lib/environment/deployments";
import type { Trigger } from "@/types/triggers";
import { BasicMarkdownText } from "@/components/ui/markdown-text";
import { Badge } from "@/components/ui/badge";
import type { DeepAgentConfiguration } from "@/types/deep-agent";

interface ToolWithDefaultInterruptConfig {
  name: string;
  default_interrupt: boolean;
}

interface BraceTrigger {
  id: string;
  name: string;
  description?: string;
}

type StateType = {
  messages: Message[];
  tools: ToolWithDefaultInterruptConfig[];
  assistant: Assistant | null;
  triggers: BraceTrigger[];
  enabled_trigger_ids: string[] | null;
  cron_schedule: string[] | null;
  test_thread_messages: Message[];
  agent_config: DeepAgentConfiguration;
  agent_id: string | null;
};

interface BraceCardProps {
  onClose: () => void;
  assistant: Assistant | null;
  tools: ToolWithDefaultInterruptConfig[];
  triggers: Trigger[];
  enabledTriggerIds: string[];
  testThreadMessages?: Message[];
  onAgentUpdated: () => void;
}

export function BraceCard({
  onClose,
  assistant,
  tools,
  triggers,
  enabledTriggerIds,
  testThreadMessages = [],
  onAgentUpdated,
}: BraceCardProps): React.ReactNode {
  const [input, setInput] = useState("");
  const { session } = useAuthContext();
  const [deploymentId] = useDeployment();
  const [isFirstSubmit, setIsFirstSubmit] = useState(true);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  const client = useMemo(() => {
    if (!session?.accessToken || !deploymentId) return undefined;
    return createClient(deploymentId, session.accessToken);
  }, [deploymentId, session?.accessToken]);

  const isEditAgentToolMessage = (message: Message): boolean => {
    if (message.type !== "tool") return false;

    const toolMessage = message as any;
    return toolMessage.name === "edit_agent";
  };

  const getEditAgentToolCall = (message: Message) => {
    if (message.type !== "ai") return null;

    const toolCalls = (message as any).tool_calls;
    if (!toolCalls || !Array.isArray(toolCalls)) return null;

    const editAgentCall = toolCalls.find(
      (call: any) => call.name === "edit_agent",
    );

    return editAgentCall?.args || null;
  };

  const getEditAgentToolState = (
    aiMessage: Message,
  ): "loading" | "completed" | "no-op" | null => {
    const hasToolCall = getEditAgentToolCall(aiMessage);
    if (!hasToolCall) return null;

    // Find if there's a corresponding tool message after this AI message
    const aiMessageIndex = stream.messages.findIndex(
      (m) => m.id === aiMessage.id,
    );
    const hasToolMessage = stream.messages
      .slice(aiMessageIndex + 1)
      .some((m) => isEditAgentToolMessage(m));

    if (hasToolMessage) {
      return "completed";
    }

    if (stream.isLoading) {
      return "loading";
    }

    return "no-op";
  };

  const stream = useStream<StateType>({
    assistantId: "brace_agent",
    client: client,
    reconnectOnMount: false,
    defaultHeaders: { "x-auth-scheme": "langsmith" },
  });

  useEffect(() => {
    const hasEditAgentToolMessage = stream.messages.some((message) => {
      if (!message.id || processedMessageIdsRef.current.has(message.id)) {
        return false;
      }

      if (isEditAgentToolMessage(message)) {
        processedMessageIdsRef.current.add(message.id);
        return true;
      }
      return false;
    });

    if (hasEditAgentToolMessage) {
      onAgentUpdated();
    }
  }, [stream.messages, onAgentUpdated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || stream.isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const triggersData = triggers.map((trigger) => ({
      id: trigger.id,
      name: trigger.displayName,
      description: trigger.description ?? undefined,
    }));

    const submitData: Partial<StateType> = {
      messages: [userMessage],
    };

    if (isFirstSubmit) {
      submitData.tools = tools;
      submitData.assistant = assistant;
      submitData.triggers = triggersData;
      submitData.enabled_trigger_ids = enabledTriggerIds;
      submitData.test_thread_messages = testThreadMessages;
      submitData.agent_config = (assistant?.config?.configurable ??
        {}) as unknown as DeepAgentConfiguration;
      submitData.agent_id = assistant?.assistant_id;
      setIsFirstSubmit(false);
    }

    stream.submit(submitData, {
      optimisticValues: (prev) => ({
        messages: [...(prev.messages ?? []), userMessage],
      }),
    });

    setInput("");
  };

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-purple-50 shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-100 bg-purple-100/60 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="text-sm font-semibold text-gray-700">Brace</div>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent
              align="start"
              className="w-80"
            >
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">What's this?</h4>
                <p className="text-sm text-gray-600">
                  Brace is an agent built by LangChain which can improve your
                  agent for you! It has context into the current conversation
                  you're having with your agent, its system prompt, tools,
                  triggers, and subagents. Simply ask Brace to make a change to
                  your agent.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 transition-colors hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-3">
          {stream.messages.length === 0 ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
              <Braces className="h-4 w-4" />
              Ask Brace to help improve your agent
            </div>
          ) : (
            <div className="space-y-4">
              {stream.messages
                .filter(
                  (message: Message) =>
                    message.type === "human" || message.type === "ai",
                )
                .map((message: Message) => {
                  const editAgentState = getEditAgentToolState(message);
                  const messageContent =
                    extractStringFromMessageContent(message);
                  const hasContent = messageContent.trim().length > 0;

                  return (
                    <div
                      key={message.id}
                      className="space-y-2"
                    >
                      {hasContent && (
                        <div
                          className={`flex ${message.type === "human" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              message.type === "human"
                                ? "bg-purple-600 text-white"
                                : "border border-purple-200 bg-white text-gray-900"
                            }`}
                          >
                            <BasicMarkdownText>
                              {messageContent}
                            </BasicMarkdownText>
                          </div>
                        </div>
                      )}
                      {editAgentState && editAgentState !== "no-op" && (
                        <div className="flex items-center justify-start gap-2">
                          {editAgentState === "loading" ? (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                            >
                              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              Updating Agent...
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 hover:bg-green-100"
                            >
                              Agent Updated
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              {stream.isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Brace is thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border-t border-purple-100 p-3">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Brace to improve your agent..."
              className="flex-1 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || stream.isLoading}
              className="rounded-md bg-purple-600 px-3 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stream.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
