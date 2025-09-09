import { Agent } from "@/types/agent";
import { DeepAgentConfiguration, MCPConfig } from "@/types/deep-agent";
import { SubAgentConfig } from "@/types/deep-agent";

export const DEFAULT_FORM_CONFIG: DeepAgentConfiguration = {
  instructions: "",
  subagents: [],
  tools: {
    tools: [],
  },
  triggers: [],
};

export function getDefaultsFromAgent(agent: Agent): DeepAgentConfiguration {
  return {
    instructions:
      (agent.config?.configurable?.instructions as string | undefined) ??
      DEFAULT_FORM_CONFIG.instructions,
    subagents:
      (agent.config?.configurable?.subagents as SubAgentConfig[] | undefined) ??
      DEFAULT_FORM_CONFIG.subagents,
    tools:
      (agent.config?.configurable?.tools as MCPConfig | undefined) ??
      DEFAULT_FORM_CONFIG.tools,
    triggers:
      (agent.config?.configurable?.triggers as string[] | undefined) ??
      DEFAULT_FORM_CONFIG.triggers,
  };
}
