"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Send,
  Bot,
  LoaderCircle,
  SquarePen,
  History,
  Square,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ThreadHistorySidebar } from "./ThreadHistorySidebar";
import type { SubAgent, TodoItem, ToolCall } from "../types";
import { AIMessage, Assistant, Message } from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  isPreparingToCallTaskTool,
  justCalledTaskTool,
} from "../utils";
import { v4 as uuidv4 } from "uuid";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { useChat } from "../hooks/useChat";
import { Session } from "@/lib/auth/types";

interface ChatInterfaceProps {
  agentId: string;
  deploymentId: string;
  session: Session;
  selectedSubAgent: SubAgent | null;
  onSelectSubAgent: (subAgent: SubAgent | null) => void;
  onNewThread: () => void;
  debugMode: boolean;
  setDebugMode: (debugMode: boolean) => void;
  assistantError: string | null;
  setAssistantError: (error: string | null) => void;
  activeAssistant: Assistant | null;
  setActiveAssistant: (assistant: Assistant | null) => void;
  setTodos: (todos: TodoItem[]) => void;
  setFiles: (files: Record<string, string>) => void;
}

export const ChatInterface = React.memo<ChatInterfaceProps>(
  ({
    agentId,
    deploymentId,
    session,
    selectedSubAgent,
    onSelectSubAgent,
    onNewThread,
    debugMode,
    setDebugMode,
    assistantError,
    setAssistantError,
    activeAssistant,
    setActiveAssistant,
    setTodos,
    setFiles,
  }) => {
    const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);

    const client = useMemo(() => {
      if (!deploymentId || !session?.accessToken) return null;
      return createClient(deploymentId, session.accessToken);
    }, [deploymentId, session]);

    const [threadId, setThreadId] = useQueryState("threadId");

    const [input, setInput] = useState("");
    const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const refreshActiveAssistant = useCallback(async () => {
      if (!agentId || !deploymentId || !client) {
        setActiveAssistant(null);
        setAssistantError(null);
        return;
      }
      setAssistantError(null);
      try {
        const assistant = await client.assistants.get(agentId);
        setActiveAssistant(assistant);
        setAssistantError(null);
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
    }, [client, agentId, deploymentId]);

    useEffect(() => {
      refreshActiveAssistant();
    }, [refreshActiveAssistant]);

    // When the threadId changes, grab the thread state from the graph server
    useEffect(() => {
      const fetchThreadState = async () => {
        if (!threadId || !client) {
          setTodos([]);
          setFiles({});
          setIsLoadingThreadState(false);
          return;
        }
        setIsLoadingThreadState(true);
        try {
          const state = await client.threads.getState(threadId);
          if (state.values) {
            const currentState = state.values as {
              todos?: TodoItem[];
              files?: Record<string, string>;
            };
            setTodos(currentState.todos || []);
            setFiles(currentState.files || {});
          }
        } catch (error) {
          console.error("Failed to fetch thread state:", error);
          setTodos([]);
          setFiles({});
        } finally {
          setIsLoadingThreadState(false);
        }
      };
      fetchThreadState();
    }, [threadId, client]);

    const {
      messages,
      isLoading,
      interrupt,
      getMessagesMetadata,
      sendMessage,
      runSingleStep,
      continueStream,
      stopStream,
    } = useChat(
      threadId,
      setThreadId,
      setTodos,
      setFiles,
      activeAssistant,
      deploymentId,
      agentId,
    );

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 120) + "px";
      }
    }, [input]);

    const submitDisabled = isLoading || !!interrupt || !!assistantError;

    const handleSubmit = useCallback(
      (e?: FormEvent) => {
        if (e) {
          e.preventDefault();
        }
        if (submitDisabled) return;

        const messageText = input.trim();
        if (!messageText || isLoading) return;
        if (debugMode) {
          runSingleStep([
            {
              id: uuidv4(),
              type: "human",
              content: messageText,
            },
          ]);
        } else {
          sendMessage(messageText);
        }
        setInput("");
      },
      [input, isLoading, sendMessage, debugMode, runSingleStep],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (submitDisabled) return;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit],
    );

    const handleNewThread = useCallback(() => {
      // Cancel any ongoing thread when creating new thread
      if (isLoading) {
        stopStream();
      }
      setIsThreadHistoryOpen(false);
      onNewThread();
    }, [isLoading, stopStream, onNewThread]);

    const handleThreadSelect = useCallback(
      (id: string) => {
        setThreadId(id);
        setIsThreadHistoryOpen(false);
      },
      [setThreadId],
    );

    const toggleThreadHistory = useCallback(() => {
      setIsThreadHistoryOpen((prev) => !prev);
    }, []);

    const handleContinue = useCallback(() => {
      const preparingToCallTaskTool = isPreparingToCallTaskTool(messages);
      continueStream(preparingToCallTaskTool);
    }, [continueStream, messages]);

    const handleRerunStep = useCallback(() => {
      const hasTaskToolCall = justCalledTaskTool(messages);
      let rewindIndex = messages.length - 1;
      if (hasTaskToolCall) {
        rewindIndex = messages.findLastIndex(
          (message) => message.type === "ai",
        );
        // Clear selected subAgent when replaying deletes it
        const aiMessageToUnwind = messages[rewindIndex] as AIMessage;
        if (
          aiMessageToUnwind &&
          aiMessageToUnwind.tool_calls &&
          aiMessageToUnwind.tool_calls.some(
            (toolCall) => toolCall.id === selectedSubAgent?.id,
          )
        ) {
          onSelectSubAgent(null);
        }
      }
      const meta = getMessagesMetadata(messages[rewindIndex]);
      const firstSeenState = meta?.firstSeenState;
      const { parent_checkpoint: parentCheckpoint } = firstSeenState ?? {};
      runSingleStep([], parentCheckpoint ?? undefined, hasTaskToolCall);
    }, [
      messages,
      runSingleStep,
      getMessagesMetadata,
      onSelectSubAgent,
      selectedSubAgent,
    ]);

    const hasMessages = messages.length > 0;
    const processedMessages = useMemo(() => {
      /* 
    1. Loop through all messages
    2. For each AI message, add the AI message, and any tool calls to the messageMap
    3. For each tool message, find the corresponding tool call in the messageMap and update the status and output
    */
      const messageMap = new Map<
        string,
        { message: Message; toolCalls: ToolCall[] }
      >();
      messages.forEach((message: Message) => {
        if (message.type === "ai") {
          const toolCallsInMessage: Array<{
            id?: string;
            function?: { name?: string; arguments?: unknown };
            name?: string;
            type?: string;
            args?: unknown;
            input?: unknown;
          }> = [];
          if (
            message.additional_kwargs?.tool_calls &&
            Array.isArray(message.additional_kwargs.tool_calls)
          ) {
            toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
          } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
            toolCallsInMessage.push(
              ...message.tool_calls.filter(
                (toolCall: { name?: string }) => toolCall.name !== "",
              ),
            );
          } else if (Array.isArray(message.content)) {
            const toolUseBlocks = message.content.filter(
              (block: { type?: string }) => block.type === "tool_use",
            );
            toolCallsInMessage.push(...toolUseBlocks);
          }
          const toolCallsWithStatus = toolCallsInMessage.map(
            (toolCall: {
              id?: string;
              function?: { name?: string; arguments?: unknown };
              name?: string;
              type?: string;
              args?: unknown;
              input?: unknown;
            }) => {
              const name =
                toolCall.function?.name ||
                toolCall.name ||
                toolCall.type ||
                "unknown";
              const args =
                toolCall.function?.arguments ||
                toolCall.args ||
                toolCall.input ||
                {};
              return {
                id: toolCall.id || `tool-${Math.random()}`,
                name,
                args,
                status: "pending" as const,
              } as ToolCall;
            },
          );
          messageMap.set(message.id!, {
            message,
            toolCalls: toolCallsWithStatus,
          });
        } else if (message.type === "tool") {
          const toolCallId = message.tool_call_id;
          if (!toolCallId) {
            return;
          }
          for (const [, data] of messageMap.entries()) {
            const toolCallIndex = data.toolCalls.findIndex(
              (tc: ToolCall) => tc.id === toolCallId,
            );
            if (toolCallIndex === -1) {
              continue;
            }
            data.toolCalls[toolCallIndex] = {
              ...data.toolCalls[toolCallIndex],
              status: "completed" as const,
              result: extractStringFromMessageContent(message),
            };
            break;
          }
        } else if (message.type === "human") {
          messageMap.set(message.id!, {
            message,
            toolCalls: [],
          });
        }
      });
      const processedArray = Array.from(messageMap.values());
      return processedArray.map((data, index) => {
        const prevMessage =
          index > 0 ? processedArray[index - 1].message : null;
        return {
          ...data,
          showAvatar: data.message.type !== prevMessage?.type,
        };
      });
    }, [messages]);

    return (
      <div className="flex h-screen w-full flex-col bg-[var(--color-background)]">
        <div
          className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]"
          style={{ padding: "1rem 1.5rem" }}
        >
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-[var(--color-text-primary)]" />
            <p className="text-xl font-semibold">Deep Agent</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewThread}
              disabled={!hasMessages}
              className="transition-colors duration-200 hover:bg-[var(--color-border-light)] disabled:hover:bg-transparent"
            >
              <SquarePen size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleThreadHistory}
              className="transition-colors duration-200 hover:bg-[var(--color-border-light)]"
            >
              <History size={20} />
            </Button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <ThreadHistorySidebar
            open={isThreadHistoryOpen}
            setOpen={setIsThreadHistoryOpen}
            currentThreadId={threadId}
            onThreadSelect={handleThreadSelect}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            {!hasMessages && !isLoading && !isLoadingThreadState && (
              <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                <Bot
                  size={48}
                  className="mb-6 text-[var(--color-text-tertiary)]"
                />
                <h2>Start a conversation or select a thread from history</h2>
              </div>
            )}
            {isLoadingThreadState && (
              <div className="absolute top-0 left-0 z-10 flex h-full w-full justify-center bg-[var(--color-background)] pt-[100px]">
                <LoaderCircle className="flex h-[50px] w-[50px] animate-spin items-center justify-center text-[var(--color-primary)]" />
              </div>
            )}
            <div
              className="flex-1 overflow-y-auto"
              style={{ padding: "1.5rem", paddingBottom: "50px" }}
            >
              {processedMessages.map((data) => (
                <ChatMessage
                  key={data.message.id}
                  message={data.message}
                  toolCalls={data.toolCalls}
                  showAvatar={data.showAvatar}
                  onSelectSubAgent={onSelectSubAgent}
                  selectedSubAgent={selectedSubAgent}
                />
              ))}
              {isLoading && (
                <div
                  className="flex items-center justify-center gap-2 p-4 text-[var(--color-text-secondary)]"
                  style={{ paddingTop: "2rem" }}
                >
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Working...</span>
                </div>
              )}
              {interrupt && debugMode && (
                <div
                  className="flex w-full max-w-full"
                  style={{ gap: "0.5rem" }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center"
                    style={{ marginTop: "1rem" }}
                  ></div>
                  <div
                    className="flex items-center"
                    style={{ gap: "0.5rem", marginTop: "1rem" }}
                  >
                    <Button
                      onClick={handleContinue}
                      className="rounded-sm border-[1px] border-[var(--color-success)] bg-transparent p-2 text-sm font-medium text-[var(--color-success)] transition-all duration-200 hover:scale-105 active:scale-95"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(16, 185, 129, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      Continue
                    </Button>
                    <Button
                      onClick={handleRerunStep}
                      className="rounded-sm border-[1px] border-[var(--color-warning)] bg-transparent p-2 text-sm font-medium text-[var(--color-warning)] transition-all duration-200 hover:scale-105 active:scale-95"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(245, 158, 11, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      Re-run step
                    </Button>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mx-auto mb-4 flex w-full max-w-[700px] items-center gap-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-background)] px-3 py-4 shadow-lg transition-all duration-200 focus-within:border-[var(--color-primary)] focus-within:shadow-xl"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading || !!interrupt ? "Running..." : "Type your message..."
            }
            className="font-inherit h-6 flex-1 border-0 bg-transparent px-2 py-1.5 text-sm leading-6 text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
            rows={1}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex shrink-0 cursor-pointer items-center"
                  style={{ gap: "0.25rem", padding: "4px" }}
                >
                  <label
                    htmlFor="debug-mode"
                    className="cursor-pointer text-xs whitespace-nowrap text-[var(--color-text-secondary)] select-none"
                  >
                    Debug Mode
                  </label>
                  <Switch
                    id="debug-mode"
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                  />
                </div>
              </TooltipTrigger>
              <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                  side="top"
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
                  <p style={{ margin: 0 }}>Run the agent step-by-step</p>
                  <TooltipPrimitive.Arrow
                    style={{
                      fill: "var(--color-primary)",
                      color: "var(--color-primary)",
                    }}
                  />
                </TooltipPrimitive.Content>
              </TooltipPrimitive.Portal>
            </Tooltip>
          </TooltipProvider>
          {isLoading ? (
            <button
              type="button"
              onClick={stopStream}
              className="bg-error flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-none text-white transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-95"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || submitDisabled}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none p-2 text-white transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
