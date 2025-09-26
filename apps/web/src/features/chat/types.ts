import type { Agent } from "@/types/agent";
import type { Thread } from "@langchain/langgraph-sdk";

export interface ChatHistoryItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
export type ThreadItem = {
  id: string;
  updatedAt: Date;
  status: Thread["status"] | "draft";
  title: string;
  description: string;
  assistantId?: string;
};

export type AgentSummary = {
  agent: Agent;
  latestThread?: ThreadItem;
  interrupted?: string;
};
