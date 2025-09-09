import { HumanInterruptConfig } from "@/types/inbox";

export interface SubAgentConfig {
  name?: string;
  description?: string;
  prompt?: string;
  tools?: string[];
  mcp_server?: string;
}

export type TriggersConfig = string[];

export interface MCPConfig {
  tools?: string[];
  url?: string;
  auth_required?: boolean;
  interrupt_config?: Record<string, boolean | HumanInterruptConfig>;
}

export interface DeepAgentConfiguration {
  instructions: string;
  subagents: SubAgentConfig[];
  tools: MCPConfig;
  triggers: TriggersConfig;
}
