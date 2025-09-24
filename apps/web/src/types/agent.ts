import { Assistant } from "@langchain/langgraph-sdk";

export type AgentConfigType = "tools" | "triggers" | "subagents";
export interface Agent extends Assistant {
  deploymentId: string;
  supportedConfigs?: AgentConfigType[];
}
