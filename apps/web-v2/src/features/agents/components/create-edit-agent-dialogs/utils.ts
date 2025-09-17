import { Agent } from "@/types/agent";
import { DeepAgentConfiguration, MCPConfig } from "@/types/deep-agent";
import { SubAgentConfig } from "@/types/deep-agent";
import { UseFormReturn } from "react-hook-form";
import { AgentFormValues } from "./types";
import { toast } from "sonner";

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

export async function handleCopyConfig(
  formRef: UseFormReturn<AgentFormValues> | null,
) {
  if (!formRef) return;

  const formData = formRef.getValues();
  const configToCopy = {
    name: formData.name,
    metadata: {
      description: formData.description,
    },
    config: {
      configurable: formData.config,
    },
  };

  try {
    await navigator.clipboard.writeText(JSON.stringify(configToCopy, null, 2));
    toast.success("Agent configuration copied to clipboard", {
      richColors: true,
    });
  } catch {
    toast.error("Failed to copy configuration", {
      richColors: true,
    });
  }
}

export async function handlePasteConfig(
  formRef: UseFormReturn<AgentFormValues> | null,
) {
  if (!formRef) return;

  try {
    const clipboardText = await navigator.clipboard.readText();
    const parsedConfig = JSON.parse(clipboardText);

    // Validate the structure
    if (typeof parsedConfig !== "object" || parsedConfig === null) {
      throw new Error("Invalid configuration format");
    }

    if (!(parsedConfig.metadata && parsedConfig.config?.configurable)) {
      throw new Error("Invalid configuration format");
    }

    const name = parsedConfig.name as string | undefined;
    const description = parsedConfig.metadata.description as string | undefined;
    const config = parsedConfig.config.configurable as
      | Record<string, unknown>
      | undefined;

    // Set form values
    if (name) {
      formRef.setValue("name", name);
    }
    if (description) {
      formRef.setValue("description", description);
    }
    if (isValidDeepAgentConfiguration(config)) {
      formRef.setValue("config", config);
    }

    toast.success("Agent configuration pasted successfully", {
      richColors: true,
    });
  } catch (_error) {
    toast.error(
      "Failed to paste configuration. Please ensure it's valid JSON format.",
      {
        richColors: true,
      },
    );
  }
}
