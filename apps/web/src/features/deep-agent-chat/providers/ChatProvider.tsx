"use client";

import React, { ReactNode } from "react";
import { Assistant } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { useChat } from "../hooks/useChat";
import type { TodoItem } from "../types";
import { ChatContext } from "./ChatContext";

interface ChatProviderProps {
  children: ReactNode;
  setTodos: (todos: TodoItem[]) => void;
  setFiles: (files: Record<string, string>) => void;
  activeAssistant: Assistant | null;
  deploymentId: string | null;
  agentId: string | null;
}

export function ChatProvider({
  children,
  setTodos,
  setFiles,
  activeAssistant,
  deploymentId,
  agentId,
}: ChatProviderProps) {
  const [threadId, setThreadId] = useQueryState("threadId");

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
