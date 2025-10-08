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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  LoaderCircle,
  Square,
  ArrowUp,
  CheckCircle,
  Clock,
  Circle,
  FileIcon,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import type { TodoItem, ToolCall } from "../types";
import { Assistant, Message } from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  isPreparingToCallTaskTool,
} from "../utils";
import { v4 as uuidv4 } from "uuid";
import { useChatContext } from "../providers/ChatProvider";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { useStickToBottom } from "use-stick-to-bottom";
import { FilesPopover } from "./TasksFilesSidebar";

interface ChatInterfaceProps {
  assistant: Assistant | null;
  debugMode: boolean;
  setDebugMode: (debugMode: boolean) => void;
  // Optional controlled view props from host app
  view?: "chat" | "workflow";
  onViewChange?: (view: "chat" | "workflow") => void;
  hideInternalToggle?: boolean;
  InterruptActionsRenderer?: React.ComponentType;
  onInput?: (input: string) => void;

  controls: React.ReactNode;
  banner?: React.ReactNode;
  empty: React.ReactNode;
  skeleton: React.ReactNode;
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
    assistant,
    debugMode,
    setDebugMode,
    view,
    onViewChange,
    onInput,
    controls,
    banner,
    hideInternalToggle,
    empty,
    skeleton,
  }) => {
    const [threadId] = useQueryState("threadId");
    const [agentId] = useQueryState("agentId");
    const [metaOpen, setMetaOpen] = useState<"tasks" | "files" | null>(null);
    const tasksContainerRef = useRef<HTMLDivElement | null>(null);
    const [isWorkflowView, setIsWorkflowView] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const isControlledView = typeof view !== "undefined";
    const workflowView = isControlledView
      ? view === "workflow"
      : isWorkflowView;

    useEffect(() => {
      const timeout = setTimeout(() => void textareaRef.current?.focus());
      return () => clearTimeout(timeout);
    }, [threadId, agentId]);

    const setView = useCallback(
      (view: "chat" | "workflow") => {
        onViewChange?.(view);
        if (!isControlledView) {
          setIsWorkflowView(view === "workflow");
        }
      },
      [onViewChange, isControlledView],
    );

    const [input, _setInput] = useState("");
    const { scrollRef, contentRef } = useStickToBottom();

    const inputCallbackRef = useRef(onInput);
    inputCallbackRef.current = onInput;

    const setInput = useCallback(
      (value: string) => {
        _setInput(value);
        inputCallbackRef.current?.(value);
      },
      [inputCallbackRef],
    );

    const {
      stream,
      messages,
      todos,
      files,
      ui,
      setFiles,
      isLoading,
      isThreadLoading,
      interrupt,
      getMessagesMetadata,
      sendMessage,
      runSingleStep,
      continueStream,
      stopStream,
    } = useChatContext();

    const submitDisabled = isLoading || !assistant;

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
      [
        input,
        isLoading,
        sendMessage,
        debugMode,
        setInput,
        runSingleStep,
        submitDisabled,
      ],
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
                status: interrupt ? "interrupted" : ("pending" as const),
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
    }, [messages, interrupt]);

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

    const groupedTodos = {
      in_progress: todos.filter((t) => t.status === "in_progress"),
      pending: todos.filter((t) => t.status === "pending"),
      completed: todos.filter((t) => t.status === "completed"),
    };

    const hasTasks = todos.length > 0;
    const hasFiles = Object.keys(files).length > 0;

    const isEmpty = empty != null && processedMessages.length === 0;

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    };

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
          ref={scrollRef}
        >
          <div
            className="mx-auto w-full px-6 pt-4 pb-6"
            ref={contentRef}
          >
          {isThreadLoading ? (
            skeleton
          ) : (
            <>
              {processedMessages.map((data, index) => {
                const messageUi = ui?.filter(
                  (u: any) => u.metadata?.message_id === data.message.id
                );
                return (
                  <ChatMessage
                    key={data.message.id}
                    message={data.message}
                    toolCalls={data.toolCalls}
                    onRestartFromAIMessage={handleRestartFromAIMessage}
                    onRestartFromSubTask={handleRestartFromSubTask}
                    debugMode={debugMode}
                    isLoading={isLoading}
                    isLastMessage={index === processedMessages.length - 1}
                    interrupt={interrupt}
                    ui={messageUi}
                    stream={stream}
                  />
                );
              })}
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
            </>
          )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-background">
          {isEmpty && (
            <div className="mx-4 mb-4 flex flex-col items-center gap-3 text-center">
              <h1 className="text-2xl font-medium">
                What would you like to work on?
              </h1>
            </div>
          )}

          <div
            className={cn(
              "bg-background mx-4 mb-6 flex flex-shrink-0 flex-col overflow-hidden rounded-xl border",
              "mx-auto w-[calc(100%-32px)] transition-colors duration-200 ease-in-out",
            )}
          >
          {(hasTasks || hasFiles) && (
            <div className="bg-sidebar flex max-h-72 flex-col overflow-y-auto border-b empty:hidden">
              {!metaOpen && (
                <>
                  {(() => {
                    const activeTask = todos.find(
                      (t) => t.status === "in_progress",
                    );

                    const totalTasks = todos.length;
                    const remainingTasks =
                      totalTasks - groupedTodos.pending.length;
                    const isCompleted = totalTasks === remainingTasks;

                    const tasksTrigger = (() => {
                      if (!hasTasks) return null;
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setMetaOpen((prev) =>
                              prev === "tasks" ? null : "tasks",
                            )
                          }
                          className="grid w-full cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-3 px-4.5 py-3 text-left"
                          aria-expanded={metaOpen === "tasks"}
                        >
                          {(() => {
                            if (isCompleted) {
                              return [
                                <CheckCircle
                                  size={16}
                                  className="text-success/80"
                                />,
                                <span className="ml-[1px] min-w-0 truncate text-sm">
                                  All tasks completed
                                </span>,
                              ];
                            }

                            if (activeTask != null) {
                              return [
                                getStatusIcon(activeTask.status),
                                <span className="ml-[1px] min-w-0 truncate text-sm">
                                  Task{" "}
                                  {totalTasks - groupedTodos.pending.length} of{" "}
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
                              <span className="ml-[1px] min-w-0 truncate text-sm">
                                Task {totalTasks - groupedTodos.pending.length}{" "}
                                of {totalTasks}
                              </span>,
                            ];
                          })()}
                        </button>
                      );
                    })();

                    const filesTrigger = (() => {
                      if (!hasFiles) return null;
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setMetaOpen((prev) =>
                              prev === "files" ? null : "files",
                            )
                          }
                          className="flex flex-shrink-0 cursor-pointer items-center gap-2 px-4.5 py-3 text-left text-sm"
                          aria-expanded={metaOpen === "files"}
                        >
                          <FileIcon size={16} />
                          Files
                          <span className="h-4 min-w-4 rounded-full bg-[#2F6868] px-0.5 text-center text-[10px] leading-[16px] text-white">
                            {Object.keys(files).length}
                          </span>
                        </button>
                      );
                    })();

                    return (
                      <div className="grid grid-cols-[1fr_auto_auto] items-center">
                        {tasksTrigger}
                        {filesTrigger}
                      </div>
                    );
                  })()}
                </>
              )}

              {metaOpen && (
                <>
                  <div className="bg-sidebar sticky top-0 flex items-stretch text-sm">
                    {hasTasks && (
                      <button
                        type="button"
                        className="py-3 pr-4 first:pl-4.5 aria-expanded:font-semibold"
                        onClick={() =>
                          setMetaOpen((prev) =>
                            prev === "tasks" ? null : "tasks",
                          )
                        }
                        aria-expanded={metaOpen === "tasks"}
                      >
                        Tasks
                      </button>
                    )}
                    {hasFiles && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 py-3 pr-4 first:pl-4.5 aria-expanded:font-semibold"
                        onClick={() =>
                          setMetaOpen((prev) =>
                            prev === "files" ? null : "files",
                          )
                        }
                        aria-expanded={metaOpen === "files"}
                      >
                        Files
                        <span className="h-4 min-w-4 rounded-full bg-[#2F6868] px-0.5 text-center text-[10px] leading-[16px] text-white">
                          {Object.keys(files).length}
                        </span>
                      </button>
                    )}
                    <button
                      aria-label="Close"
                      className="flex-1"
                      onClick={() => setMetaOpen(null)}
                    />
                  </div>
                  <div
                    ref={tasksContainerRef}
                    className="px-4.5"
                  >
                    {metaOpen === "tasks" &&
                      Object.entries(groupedTodos)
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

                    {metaOpen === "files" && (
                      <div className="mb-6">
                        <FilesPopover
                          files={files}
                          setFiles={setFiles}
                          editDisabled={
                            isLoading === true || interrupt !== undefined
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isLoading
                  ? "Running..."
                  : "Write your message..."
              }
              className="font-inherit text-primary placeholder:text-tertiary field-sizing-content flex-1 resize-none border-0 bg-transparent p-4.5 pb-7.5 text-sm leading-6 outline-none"
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
          {banner && (
            <div className="mx-auto mt-3 mb-3 w-[calc(100%-32px)] max-w-[512px]">
              {banner}
            </div>
          )}
        </div>

        {isEmpty && <div className="flex-grow-3">{empty}</div>}
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
