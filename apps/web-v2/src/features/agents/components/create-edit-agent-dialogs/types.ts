import { DeepAgentConfiguration } from "@/types/deep-agent";

export interface AgentFormValues {
  name: string;
  description: string;
  config: DeepAgentConfiguration;
}
