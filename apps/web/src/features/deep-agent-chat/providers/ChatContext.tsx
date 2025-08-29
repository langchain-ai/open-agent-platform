"use client";

import { createContext, useContext } from "react";
import { Message, Checkpoint, Interrupt } from "@langchain/langgraph-sdk";

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  interrupt: Interrupt | undefined;
  getMessagesMetadata: (message: Message, index?: number) => any;
  sendMessage: (message: string) => void;
  runSingleStep: (
    messages: Message[],
    checkpoint?: Checkpoint,
    isRerunningSubagent?: boolean,
    optimisticMessages?: Message[],
  ) => void;
  continueStream: (hasTaskToolCall?: boolean) => void;
  stopStream: () => void;
}

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
