"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  FormEvent,
} from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { LoaderCircle, Square, ArrowUp } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { AgentGraphVisualization } from "./AgentGraphVisualization";
import { ThreadHistorySidebar } from "./ThreadHistorySidebar";
import type { TodoItem, ToolCall } from "../types";
import { Assistant, Message } from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  isPreparingToCallTaskTool,
} from "../utils";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useClients } from "../providers/ClientProvider";
import { useChatContext } from "../providers/ChatContext";
import { useQueryState } from "nuqs";
import { cn } from "../lib/utils";

interface ChatInterfaceProps {
  assistantId: string;
  activeAssistant?: Assistant | null;
  debugMode: boolean;
  setDebugMode: (debugMode: boolean) => void;
  assistantError: string | null;
  setAssistantError: (error: string | null) => void;
  setActiveAssistant: (assistant: Assistant | null) => void;
  setTodos: (todos: TodoItem[]) => void;
  setFiles: (files: Record<string, string>) => void;
  // Optional controlled view props from host app
  view?: "chat" | "workflow";
  onViewChange?: (view: "chat" | "workflow") => void;
  hideInternalToggle?: boolean;
}

export const ChatInterface = React.memo<ChatInterfaceProps>(
  ({
    assistantId,
    activeAssistant: _activeAssistant,
    debugMode,
    setDebugMode,
    assistantError,
    setAssistantError,
    setActiveAssistant,
    setTodos,
    setFiles,
    view,
    onViewChange,
    hideInternalToggle,
  }) => {
    const [threadId, setThreadId] = useQueryState("threadId");
    const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);
    const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
    const [isWorkflowView, setIsWorkflowView] = useState(false);

    const isControlledView = typeof view !== "undefined";
    const workflowView = isControlledView
      ? view === "workflow"
      : isWorkflowView;

    const setView = useCallback(
      (view: "chat" | "workflow") => {
        onViewChange?.(view);
        if (!isControlledView) {
          setIsWorkflowView(view === "workflow");
        }
      },
      [onViewChange, isControlledView],
    );

    const { client } = useClients();

    const [input, setInput] = useState("");
    const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const refreshActiveAssistant = useCallback(async () => {
      if (!assistantId || !client) {
        setActiveAssistant(null);
        setAssistantError(null);
        return;
      }
      setAssistantError(null);
      try {
        const assistant = await client.assistants.get(assistantId);
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
    }, [client, assistantId, setActiveAssistant, setAssistantError]);

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
    }, [threadId, client, setTodos, setFiles]);

    // Delay showing the loading spinner to avoid flashes
    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      if (isLoadingThreadState) {
        timeoutId = setTimeout(() => {
          setShowLoadingSpinner(true);
        }, 200); // Show spinner only after 200ms delay
      } else {
        setShowLoadingSpinner(false);
      }
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [isLoadingThreadState]);

    const {
      messages,
      isLoading,
      interrupt,
      getMessagesMetadata,
      sendMessage,
      runSingleStep,
      continueStream,
      stopStream,
    } = useChatContext();

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
      [input, isLoading, sendMessage, debugMode, runSingleStep, submitDisabled],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (submitDisabled) return;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit, submitDisabled],
    );

    const handleThreadSelect = useCallback(
      (id: string) => {
        setThreadId(id);
        setIsThreadHistoryOpen(false);
      },
      [setThreadId],
    );

    const handleContinue = useCallback(() => {
      const preparingToCallTaskTool = isPreparingToCallTaskTool(messages);
      continueStream(preparingToCallTaskTool);
    }, [continueStream, messages]);

    const handleRestartFromAIMessage = useCallback(
      (message: Message) => {
        if (!debugMode) return;
        const meta = getMessagesMetadata(message);
        const { parent_checkpoint: parentCheckpoint } =
          meta?.firstSeenState ?? {};
        const msgIndex = messages.findIndex((m) => m.id === message.id);
        runSingleStep(
          [],
          parentCheckpoint ?? undefined,
          false,
          messages.slice(0, msgIndex),
        );
      },
      [debugMode, runSingleStep, messages, getMessagesMetadata],
    );

    const handleRestartFromSubTask = useCallback(
      (toolCallId: string) => {
        if (!debugMode) return;
        const msgIndex = messages.findIndex(
          (m) => m.type === "tool" && m.tool_call_id === toolCallId,
        );
        const meta = getMessagesMetadata(messages[msgIndex]);
        const { parent_checkpoint: parentCheckpoint } =
          meta?.firstSeenState ?? {};
        runSingleStep(
          [],
          parentCheckpoint ?? undefined,
          true,
          messages.slice(0, msgIndex),
        );
      },
      [debugMode, runSingleStep, messages, getMessagesMetadata],
    );

    // Reserved: additional UI state
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
      <div className="flex h-full w-full flex-col font-sans">
        {/* <div className="border-border flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="text-primary h-6 w-6" />
            <p className="text-xl font-semibold">Deep Agent</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewThread}
              disabled={!hasMessages}
              className="hover:bg-border-light transition-colors duration-200 disabled:hover:bg-transparent"
            >
              <SquarePen size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleThreadHistory}
              className="hover:bg-border-light transition-colors duration-200"
            >
              <History size={20} />
            </Button>
          </div>
        </div> */}
        {!hideInternalToggle && (
          <div className="flex w-full justify-center">
            <div className="flex h-[24px] w-[134px] items-center gap-0 overflow-hidden rounded border border-[#D1D1D6] bg-white p-[3px] text-[12px] shadow-sm">
              <button
                type="button"
                onClick={() => setView("chat")}
                className={cn(
                  "flex h-full flex-1 items-center justify-center truncate rounded p-[3px]",
                  { "bg-[#F4F3FF]": !workflowView },
                )}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setView("workflow")}
                className={cn(
                  "flex h-full flex-1 items-center justify-center truncate rounded p-[3px]",
                  { "bg-[#F4F3FF]": workflowView },
                )}
              >
                Workflow
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <ThreadHistorySidebar
            open={isThreadHistoryOpen}
            setOpen={setIsThreadHistoryOpen}
            onThreadSelect={handleThreadSelect}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            {showLoadingSpinner && (
              <div className="absolute top-0 left-0 z-10 flex h-full w-full justify-center pt-[100px]">
                <LoaderCircle className="text-primary flex h-[50px] w-[50px] animate-spin items-center justify-center" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
              {!workflowView ? (
                <>
                  {processedMessages.map((data, index) => (
                    <ChatMessage
                      key={data.message.id}
                      message={data.message}
                      toolCalls={data.toolCalls}
                      onRestartFromAIMessage={handleRestartFromAIMessage}
                      onRestartFromSubTask={handleRestartFromSubTask}
                      debugMode={debugMode}
                      isLoading={isLoading}
                      isLastMessage={index === processedMessages.length - 1}
                    />
                  ))}
                  {isLoading && (
                    <div className="text-primary/50 flex items-center justify-center gap-2 p-4 pt-8">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {interrupt && debugMode && (
                    <div className="mt-4">
                      <Button
                        onClick={handleContinue}
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs"
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex h-full w-full items-stretch">
                  <div className="flex h-full w-full flex-1">
                    <AgentGraphVisualization
                      configurable={
                        (getMessagesMetadata(messages[messages.length - 1])
                          ?.activeAssistant?.config?.configurable as any) || {}
                      }
                      name={
                        getMessagesMetadata(messages[messages.length - 1])
                          ?.activeAssistant?.name || "Agent"
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {!isWorkflowView && (
          <form
            onSubmit={handleSubmit}
            className="border-border focus-within:border-primary focus-within:ring-primary mx-6 mb-0 flex w-auto items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-200 ease-in-out focus-within:ring-offset-2"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isLoading || !!interrupt
                  ? "Running..."
                  : "Write your message..."
              }
              className="font-inherit text-primary placeholder:text-tertiary flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 outline-none"
              rows={1}
            />
            <div className="flex items-center gap-2 pr-2">
              <label
                htmlFor="debug-toggle"
                className="text-xs text-[#3F3F46]"
              >
                Debug
              </label>
              <Switch
                id="debug-toggle"
                checked={debugMode}
                onCheckedChange={setDebugMode}
              />
            </div>
            <Button
              type={isLoading ? "button" : "submit"}
              variant={isLoading ? "destructive" : "default"}
              onClick={isLoading ? stopStream : handleSubmit}
              disabled={!isLoading && (submitDisabled || !input.trim())}
              className="rounded-full p-5"
            >
              {isLoading ? <Square size={14} /> : <ArrowUp size={16} />}
            </Button>
          </form>
        )}
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
