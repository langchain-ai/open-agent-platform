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
import {
  LoaderCircle,
  Square,
  ArrowUp,
  CheckCircle,
  Clock,
  Circle,
  FileIcon,
  Braces,
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
import { formatUnknownError } from "@/lib/errors";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { ThreadActionsView } from "./interrupted-actions";
import { ThreadHistorySidebar } from "./ThreadHistorySidebar";
import { useStickToBottom } from "use-stick-to-bottom";
import { FilesPopover } from "./TasksFilesSidebar";
import useInterruptedActions from "./interrupted-actions/hooks/use-interrupted-actions";
import { HumanResponseWithEdits } from "../types/inbox";

interface ChatInterfaceProps {
  assistant: Assistant | null;
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
  testMode?: boolean;
  onTestFeedback?: () => void;
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
    view,
    onViewChange,
    onInput,
    controls,
    banner,
    hideInternalToggle,
    empty,
    skeleton,
    testMode = false,
    onTestFeedback,
  }) => {
    const [threadId, setThreadId] = useQueryState("threadId");
    const [agentId] = useQueryState("agentId");
    const [metaOpen, setMetaOpen] = useState<"tasks" | "files" | null>(null);
    const tasksContainerRef = useRef<HTMLDivElement | null>(null);
    const [isWorkflowView, setIsWorkflowView] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const isControlledView = typeof view !== "undefined";
    const workflowView = isControlledView
      ? view === "workflow"
      : isWorkflowView;

    // TODO: This UI is not implemented. Don't enable until UI is enabled.
    // const debugMode = Boolean(testMode);
    const debugMode = false;

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

    const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);

    const {
      messages,
      todos,
      files,
      setFiles,
      isLoading,
      isThreadLoading,
      interrupt,
      error,
      getMessagesMetadata,
      sendMessage,
      runSingleStep,
      continueStream,
      stopStream,
    } = useChatContext();

    const actions = useInterruptedActions({
      interrupt,
    });

    const submitDisabled = isLoading || !assistant;

    const handleSubmit = useCallback(
      (e?: FormEvent) => {
        if (e) {
          e.preventDefault();
        }
        if (submitDisabled) return;

        if (interrupt) {
          actions.handleSubmit(e);
          actions.resetState();
          setInput("");
          return;
        }

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
        actions,
        interrupt,
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

    const latestAIMessageId = useMemo(() => {
      for (let i = processedMessages.length - 1; i >= 0; i -= 1) {
        const message = processedMessages[i]?.message;
        if (message?.type === "ai" && message.id) {
          return message.id;
        }
      }
      return null;
    }, [processedMessages]);

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

    const groupedTodos = {
      in_progress: todos.filter((t) => t.status === "in_progress"),
      pending: todos.filter((t) => t.status === "pending"),
      completed: todos.filter((t) => t.status === "completed"),
    };

    const hasTasks = todos.length > 0;
    const hasFiles = Object.keys(files).length > 0;

    const isEmpty =
      empty != null && processedMessages.length === 0 && !testMode;

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);

      if (interrupt) {
        actions.setSelectedSubmitType("response");
        actions.setHasAddedResponse(true);

        actions.setHumanResponse((prev) => {
          const newResponse: HumanResponseWithEdits = {
            type: "response",
            args: e.target.value,
          };

          if (prev.find((p) => p.type === newResponse.type)) {
            return prev.map((p) => {
              if (p.type === newResponse.type) {
                if (p.acceptAllowed) {
                  return {
                    ...newResponse,
                    acceptAllowed: true,
                    editsMade: !!e.target.value,
                  };
                }
                return newResponse;
              }
              return p;
            });
          } else {
            throw new Error("No human response found for string response");
          }
        });
      }
    };

    return (
      <div
        className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain"
        ref={scrollRef}
      >
        <div
          className="mx-auto w-full max-w-[1024px] flex-grow px-6 pt-4 pb-10"
          ref={contentRef}
        >
          {isThreadLoading ? (
            skeleton
          ) : (
            <>
              {processedMessages.map((data, index) => {
                const isLatestAIMessage =
                  data.message.type === "ai" &&
                  data.message.id === latestAIMessageId;

                return (
                  <Fragment key={data.message.id}>
                    <ChatMessage
                      message={data.message}
                      toolCalls={data.toolCalls}
                      onRestartFromAIMessage={handleRestartFromAIMessage}
                      onRestartFromSubTask={handleRestartFromSubTask}
                      debugMode={debugMode}
                      isLoading={isLoading}
                      isLastMessage={index === processedMessages.length - 1}
                      interrupt={interrupt}
                    />
                    {error && isLatestAIMessage ? (
                      <div className="mx-auto my-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
                        <span className="font-medium">Error:</span>
                        <span className="text-red-700">
                          {formatUnknownError(error)}
                        </span>
                      </div>
                    ) : null}
                    {testMode &&
                      onTestFeedback &&
                      isLatestAIMessage &&
                      !isLoading && (
                        <button
                          type="button"
                          onClick={onTestFeedback}
                          className="group mt-3 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50/80 px-3 py-2 text-left text-sm transition hover:border-purple-300 hover:bg-purple-100 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          <span className="text-gray-700 group-hover:text-gray-800">
                            Not quite right? Ask Brace to revise this reply.
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-purple-700 group-hover:text-purple-800">
                            <Braces className="h-4 w-4" />
                            <span className="text-xs font-medium tracking-wide uppercase">
                              Open Brace
                            </span>
                          </span>
                        </button>
                      )}
                  </Fragment>
                );
              })}
              {testMode &&
                processedMessages.length === 0 &&
                !isThreadLoading && (
                  <div className="flex h-full items-center justify-center px-4 py-12 text-center text-sm text-gray-500">
                    Test mode is enabled. Messages here run your agent with the
                    latest saved configuration for exploration purposes.
                  </div>
                )}
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
            </>
          )}
        </div>

        {isEmpty && (
          <div className="mx-4 mb-8 flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-medium">
              What would you like to work on?
            </h1>
          </div>
        )}

        <div
          className={cn(
            "bg-background sticky z-10 mx-4 mb-6 flex flex-shrink-0 flex-col overflow-hidden rounded-xl border",
            "mx-auto w-[calc(100%-32px)] max-w-[1024px] transition-colors duration-200 ease-in-out",
            isEmpty ? "top-6" : "bottom-6",
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
                      <div className="grid grid-cols-[1fr_auto] items-center">
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
                  : interrupt
                    ? "Respond to the interrupt..."
                    : "Write your message..."
              }
              className="font-inherit text-primary placeholder:text-tertiary field-sizing-content flex-1 resize-none border-0 bg-transparent p-4.5 pb-7.5 text-sm leading-6 outline-none"
              rows={1}
            />
            <div className="flex justify-between gap-2 p-3">
              <div className="flex items-center gap-2">{controls}</div>

              <div className="flex justify-end gap-4">
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
                      <span>{interrupt ? "Resume" : "Send"}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
        {banner && (
          <div className="sticky bottom-6 z-10 mx-auto mt-3 w-[calc(100%-32px)] max-w-[512px]">
            {banner}
          </div>
        )}

        {isEmpty && <div className="flex-grow-3">{empty}</div>}
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
