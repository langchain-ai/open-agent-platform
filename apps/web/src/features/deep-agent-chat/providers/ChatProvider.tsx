"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Message, Assistant, Checkpoint, Interrupt } from "@langchain/langgraph-sdk";
import { useChat } from "../hooks/useChat";
import type { TodoItem } from "../types";

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  interrupt: Interrupt | undefined;
  getMessagesMetadata: (message: Message, index?: number) => any;
  sendMessage: (message: string) => void;
  runSingleStep: (
    messages: Message[],
    checkpoint?: Checkpoint,
    isRerunningSubagent?: boolean,
    optimisticMessages?: Message[]
  ) => void;
  continueStream: (hasTaskToolCall?: boolean) => void;
  stopStream: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  threadId: string | null;
  setThreadId: (
    value: string | ((old: string | null) => string | null) | null
  ) => void;
  setTodos: (todos: TodoItem[]) => void;
  setFiles: (files: Record<string, string>) => void;
  activeAssistant: Assistant | null;
  deploymentId: string | null;
  agentId: string | null;
}

export function ChatProvider({
  children,
  threadId,
  setThreadId,
  setTodos,
  setFiles,
  activeAssistant,
  deploymentId,
  agentId,
}: ChatProviderProps) {
  const chat = useChat(
    threadId,
    setThreadId,
    setTodos,
    setFiles,
    activeAssistant,
    deploymentId,
    agentId
  );

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}