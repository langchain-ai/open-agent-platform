"use client";

import React, { ReactNode } from "react";
import { Assistant } from "@langchain/langgraph-sdk";
import { useChat } from "../hooks/useChat";
import type { TodoItem } from "../types";
import { ChatContext } from "./ChatContext";

interface ChatProviderProps {
  children: ReactNode;
  threadId: string | null;
  setThreadId: (
    value: string | ((old: string | null) => string | null) | null,
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
    agentId,
  );

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}
