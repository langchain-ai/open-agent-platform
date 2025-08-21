import { Assistant } from "@langchain/langgraph-sdk";

export interface Agent extends Assistant {
  deploymentId: string;
  supportedConfigs?: ["tools" | "rag" | "supervisor" | "deep_agent"];
}
