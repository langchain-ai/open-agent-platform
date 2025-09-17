import { Agent } from "@/types/agent";
import { DeepAgentConfiguration, MCPConfig } from "@/types/deep-agent";
import { SubAgentConfig } from "@/types/deep-agent";

// Type guard to check if an object is a valid DeepAgentConfiguration
export function isValidDeepAgentConfiguration(
  obj: any,
): obj is DeepAgentConfiguration {
  return (
    obj &&
    typeof obj === "object" &&
    "instructions" in obj &&
    "subagents" in obj &&
    "tools" in obj &&
    "triggers" in obj
  );
}

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

export function prepareConfigForSaving(
  config: DeepAgentConfiguration,
): DeepAgentConfiguration {
  if (!config.tools?.interrupt_config) {
    return config;
  }

  if (Object.values(config.tools.interrupt_config).some((v) => !v)) {
    return {
      ...config,
      tools: {
        ...config.tools,
        interrupt_config: Object.fromEntries(
          Object.entries(config.tools.interrupt_config).filter(([_, v]) => v),
        ),
      },
    };
  }

  return config;
}
