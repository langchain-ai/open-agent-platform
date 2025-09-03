"use client";

import { ReactNode, useMemo } from "react";
import { Assistant } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { useChat } from "../hooks/useChat";
import type { TodoItem } from "../types";
import { ChatContext } from "./ChatContext";

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

  const chatValue = useMemo(() => chat, [chat]);

  return (
    <ChatContext.Provider value={chatValue}>{children}</ChatContext.Provider>
  );
}
