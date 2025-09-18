import { DeepAgentConfiguration, SubAgentConfig } from "@/types/deep-agent";
import { SubAgent } from "@/types/sub-agent";
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

export async function handleCopyConfig(config: {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  triggers: string[];
  subAgents: SubAgent[];
}) {
  const configToCopy = {
    name: config.name,
    metadata: {
      description: config.description,
    },
    config: {
      configurable: {
        instructions: config.systemPrompt,
        subagents: config.subAgents,
        tools: {
          tools: config.tools,
        },
        triggers: config.triggers,
      },
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
  onPaste: (config: {
    name: string;
    description: string;
    systemPrompt: string;
    tools: string[];
    triggers: string[];
    subAgents: SubAgent[];
  }) => void,
) {
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

    if (!isValidDeepAgentConfiguration(config)) {
      throw new Error("Invalid configuration format");
    }

    // Convert SubAgentConfig[] to SubAgent[]
    const subAgents: SubAgent[] = (config.subagents || []).map(
      (subAgent: SubAgentConfig) => ({
        name: subAgent.name || "",
        description: subAgent.description || "",
        prompt: subAgent.prompt || "",
        tools: subAgent.tools || [],
      }),
    );

    onPaste({
      name: name || "",
      description: description || "",
      systemPrompt: config.instructions || "",
      tools: config.tools?.tools || [],
      triggers: config.triggers || [],
      subAgents,
    });

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
