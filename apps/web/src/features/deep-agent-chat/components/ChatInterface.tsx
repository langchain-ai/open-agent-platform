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
  TooltipContent,
} from "@/components/ui/tooltip";
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
import { Assistant, Message } from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  isPreparingToCallTaskTool,
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
      [debugMode, runSingleStep, messages],
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
      [debugMode, runSingleStep, messages],
    );

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
      <div className="flex h-screen w-full flex-col">
        <div className="border-border flex shrink-0 items-center justify-between border-b px-6 py-4">
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
                  className="text-tertiary mb-6"
                />
                <h2>Start a conversation or select a thread from history</h2>
              </div>
            )}
            {isLoadingThreadState && (
              <div className="absolute top-0 left-0 z-10 flex h-full w-full justify-center pt-[100px]">
                <LoaderCircle className="text-primary flex h-[50px] w-[50px] animate-spin items-center justify-center" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 pb-[50px]">
              {processedMessages.map((data, index) => (
                <ChatMessage
                  key={data.message.id}
                  message={data.message}
                  toolCalls={data.toolCalls}
                  showAvatar={data.showAvatar}
                  onSelectSubAgent={onSelectSubAgent}
                  selectedSubAgent={selectedSubAgent}
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
                  <span>Working...</span>
                </div>
              )}
              {interrupt && debugMode && (
                <div className="flex w-full max-w-full gap-2">
                  <div className="mt-4 flex h-8 w-8 shrink-0 items-center justify-center"></div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      onClick={handleContinue}
                      className="border-success text-success rounded-sm border bg-transparent p-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:bg-green-500/10 active:scale-95"
                    >
                      Continue
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
          className="border-border focus-within:border-primary mx-auto mb-4 flex w-full max-w-[700px] items-center gap-3 rounded-xl border-2 px-3 py-4 shadow-lg transition-all duration-200 focus-within:shadow-xl"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading || !!interrupt ? "Running..." : "Type your message..."
            }
            className="font-inherit text-primary placeholder:text-tertiary h-6 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm leading-6 outline-none"
            rows={1}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex shrink-0 cursor-pointer items-center gap-1 p-1">
                  <label
                    htmlFor="debug-mode"
                    className="text-primary/50 cursor-pointer text-xs whitespace-nowrap select-none"
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
              <TooltipContent>Run the agent step-by-step</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            type={isLoading ? "button" : "submit"}
            variant={isLoading ? "destructive" : "default"}
            onClick={isLoading ? stopStream : handleSubmit}
            disabled={!isLoading && (submitDisabled || !input.trim())}
            size="icon"
          >
            {isLoading ? <Square size={14} /> : <Send size={16} />}
          </Button>
        </form>
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";
