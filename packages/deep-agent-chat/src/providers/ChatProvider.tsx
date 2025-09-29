"use client";

import { ReactNode, createContext, useContext } from "react";
import { Assistant } from "@langchain/langgraph-sdk";
import { useChat } from "../hooks/useChat";

interface ChatProviderProps {
  children: ReactNode;
  activeAssistant: Assistant | null;
  onThreadRevalidate?: () => void;
}

export function ChatProvider({
  children,
  activeAssistant,
  onThreadRevalidate,
}: ChatProviderProps) {
  const chat = useChat({ activeAssistant, onThreadRevalidate });

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
