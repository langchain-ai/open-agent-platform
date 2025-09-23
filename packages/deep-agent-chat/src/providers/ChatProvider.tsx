"use client";

import { ReactNode, createContext, useContext } from "react";
import { Assistant } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { useChat } from "../hooks/useChat";
import type { TodoItem } from "../types";

interface ChatProviderProps {
  children: ReactNode;
  setTodos: (todos: TodoItem[]) => void;
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => void;
  activeAssistant: Assistant | null;
  assistantId: string | null;
}

export function ChatProvider({
  children,
  setTodos,
  files,
  setFiles,
  activeAssistant,
  assistantId,
}: ChatProviderProps) {
  const [threadId, setThreadId] = useQueryState("threadId");

  const chat = useChat(
    threadId,
    setThreadId,
    setTodos,
    files,
    setFiles,
    activeAssistant,
    assistantId,
  );

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export type ChatContextType = ReturnType<typeof useChat>;

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined,
);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
