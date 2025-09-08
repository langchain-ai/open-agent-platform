import { Assistant } from "@langchain/langgraph-sdk";

export type AgentConfigType =
  | "tools"
  | "rag"
  | "supervisor"
  | "deep_agent"
  | "triggers";
export interface Agent extends Assistant {
  deploymentId: string;
  supportedConfigs?: AgentConfigType[];
}
