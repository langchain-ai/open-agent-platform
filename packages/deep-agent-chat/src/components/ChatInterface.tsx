"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  FormEvent,
  Fragment,
} from "react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
  LoaderCircle,
  Square,
  ArrowUp,
  CheckCircle,
  Clock,
  Circle,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import type { TodoItem, ToolCall } from "../types";
import { Assistant, Message } from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  isPreparingToCallTaskTool,
} from "../utils";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useClients } from "../providers/ClientProvider";
import { useChatContext } from "../providers/ChatProvider";
import { useQueryState } from "nuqs";
import { cn } from "../lib/utils";
import { ThreadActionsView } from "./interrupted-actions";
import { ThreadHistorySidebar } from "./ThreadHistorySidebar";
import { useStickToBottom } from "use-stick-to-bottom";

interface ChatInterfaceProps {
  assistantId: string;
  activeAssistant?: Assistant | null;
  debugMode: boolean;
  setDebugMode: (debugMode: boolean) => void;
  assistantError: string | null;
  setAssistantError: (error: string | null) => void;
  setActiveAssistant: (assistant: Assistant | null) => void;
  setTodos: (todos: TodoItem[]) => void;
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => void;
  // Optional controlled view props from host app
  view?: "chat" | "workflow";
  onViewChange?: (view: "chat" | "workflow") => void;
  hideInternalToggle?: boolean;
  InterruptActionsRenderer?: React.ComponentType;
  controls: React.ReactNode;
  empty: React.ReactNode;
  todos: TodoItem[];
}

const getStatusIcon = (status: TodoItem["status"], className?: string) => {
  switch (status) {
    case "completed":
      return (
        <CheckCircle
          size={16}
          className={cn("text-success/80", className)}
        />
      );
    case "in_progress":
      return (
        <Clock
          size={16}
          className={cn("text-warning/80", className)}
        />
      );
    default:
      return (
        <Circle
          size={16}
          className={cn("text-tertiary/70", className)}
        />
      );
  }
};

export const ChatInterface = React.memo<ChatInterfaceProps>(
  ({
    assistantId,
    activeAssistant: _activeAssistant,
    debugMode,
    setDebugMode,
    assistantError,
    setAssistantError,
    setActiveAssistant,
    todos,
    setTodos,
    files,
    setFiles,
    view,
    onViewChange,
    controls,
    hideInternalToggle,
    empty,
  }) => {
    const [threadId, setThreadId] = useQueryState("threadId");
    const [tasksOpen, setTasksOpen] = useState(false);
    const tasksContainerRef = useRef<HTMLDivElement | null>(null);
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
    const { scrollRef, contentRef } = useStickToBottom();

    const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);

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
          return;
        }
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
        }
      };
      fetchThreadState();
    }, [threadId, client, setTodos, setFiles]);

    const {
      messages,
      isLoading,
      isThreadLoading,
      interrupt,
      getMessagesMetadata,
      sendMessage,
      runSingleStep,
      continueStream,
      stopStream,
    } = useChatContext();

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
    // TODO: can we make this part of the hook?
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

    const toggle = !hideInternalToggle && (
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
    );

    if (isWorkflowView) {
      return (
        <div className="flex h-full w-full flex-col font-sans">
          {toggle}
          <div className="flex flex-1 overflow-hidden">
            <ThreadHistorySidebar
              open={isThreadHistoryOpen}
              setOpen={setIsThreadHistoryOpen}
              onThreadSelect={handleThreadSelect}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
              {isThreadLoading && (
                <div className="absolute top-0 left-0 z-10 flex h-full w-full justify-center pt-[100px]">
                  <LoaderCircle className="text-primary flex h-[50px] w-[50px] animate-spin items-center justify-center" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
                <div className="flex h-full w-full items-stretch">
                  <div className="flex h-full w-full flex-1">
                    {/* <AgentGraphVisualization
                      configurable={
                        (getMessagesMetadata(messages[messages.length - 1])
                          ?.activeAssistant?.config?.configurable as any) || {}
                      }
                      name={
                        getMessagesMetadata(messages[messages.length - 1])
                          ?.activeAssistant?.name || "Agent"
                      }
                    /> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto"
        ref={scrollRef}
      >
        <div
          className="flex-grow px-6 pt-4 pb-10"
          ref={contentRef}
        >
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
          {interrupt && (
            <ThreadActionsView
              interrupt={interrupt}
              threadId={threadId}
            />
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
        </div>

        <div
          className={cn(
            "bg-background sticky bottom-6 z-10 mx-4 mb-6 flex flex-shrink-0 flex-col overflow-hidden rounded-xl border",
            "transition-colors duration-200 ease-in-out",
          )}
        >
          {(() => {
            const totalTasks = todos.length;
            if (totalTasks === 0) return null;

            const groupedTodos = {
              in_progress: todos.filter((t) => t.status === "in_progress"),
              pending: todos.filter((t) => t.status === "pending"),
              completed: todos.filter((t) => t.status === "completed"),
            };

            const activeTask = todos.find((t) => t.status === "in_progress");
            const remainingTasks = totalTasks - groupedTodos.pending.length;
            const isCompleted = totalTasks === remainingTasks;

            return (
              <div className="bg-sidebar border-b">
                <button
                  type="button"
                  onClick={() => setTasksOpen((prev) => !prev)}
                  className="grid w-full cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-3 px-4.5 py-3 text-left"
                  aria-expanded={tasksOpen}
                >
                  {(() => {
                    if (tasksOpen) {
                      return <span className="text-sm font-medium">Tasks</span>;
                    }

                    if (isCompleted) {
                      return [
                        <CheckCircle
                          size={16}
                          className="text-success/80"
                        />,
                        <span className="min-w-0 truncate text-sm font-medium">
                          All tasks completed
                        </span>,
                      ];
                    }

                    if (activeTask != null) {
                      return [
                        getStatusIcon(activeTask.status),
                        <span className="min-w-0 truncate text-sm font-medium">
                          Task {totalTasks - groupedTodos.pending.length} of{" "}
                          {totalTasks}
                        </span>,
                        <span className="text-muted-foreground min-w-0 gap-2 truncate text-sm">
                          {activeTask.content}
                        </span>,
                      ];
                    }

                    return [
                      <Circle
                        size={16}
                        className="text-tertiary/70"
                      />,
                      <span className="min-w-0 truncate text-sm font-medium">
                        Task {totalTasks - groupedTodos.pending.length} of{" "}
                        {totalTasks}
                      </span>,
                    ];
                  })()}
                </button>
                {tasksOpen && (
                  <div
                    ref={tasksContainerRef}
                    className="max-h-60 overflow-y-auto px-4.5"
                  >
                    {Object.entries(groupedTodos)
                      .filter(([_, todos]) => todos.length > 0)
                      .map(([status, todos]) => (
                        <div className="mb-4">
                          <h3 className="text-tertiary mb-1 text-[10px] font-semibold tracking-wider uppercase">
                            {
                              {
                                pending: "Pending",
                                in_progress: "In Progress",
                                completed: "Completed",
                              }[status]
                            }
                          </h3>
                          <div className="grid grid-cols-[auto_1fr] gap-3 rounded-sm p-1 pl-0 text-sm">
                            {todos.map((todo, index) => (
                              <Fragment key={`${status}_${todo.id}_${index}`}>
                                {getStatusIcon(todo.status, "mt-0.5")}
                                <span className="break-words text-inherit">
                                  {todo.content}
                                </span>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })()}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isLoading || !!interrupt
                  ? "Running..."
                  : "Write your message..."
              }
              className="font-inherit text-primary placeholder:text-tertiary field-sizing-content flex-1 resize-none border-0 bg-transparent p-4.5 text-sm leading-6 outline-none"
              rows={1}
            />
            <div className="flex justify-between gap-2 p-3">
              <div className="flex items-center gap-2">{controls}</div>

              <div className="flex justify-end gap-4">
                <div className="flex items-center gap-2">
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
                >
                  {isLoading ? (
                    <>
                      <Square size={14} />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp size={18} />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {empty != null && <div className="flex-grow">{empty}</div>}
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
