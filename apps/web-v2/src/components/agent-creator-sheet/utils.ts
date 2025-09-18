import { DeepAgentConfiguration, SubAgentConfig } from "@/types/deep-agent";
import { HumanInterruptConfig } from "@/types/inbox";
import { SubAgent } from "@/types/sub-agent";
import { toast } from "sonner";

// Type guard to check if an object is a valid DeepAgentConfiguration
export function isValidDeepAgentConfiguration(
  obj: any,
): obj is DeepAgentConfiguration {
  return obj && typeof obj === "object";
}

export async function handleCopyConfig(config: {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  interruptConfig?: Record<string, HumanInterruptConfig>;
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
          interrupt_config: config.interruptConfig ?? {},
          url: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
          auth_required: process.env.NEXT_PUBLIC_SUPABASE_AUTH_MCP === "true",
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
    interruptConfig: Record<string, HumanInterruptConfig>;
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

    const interruptConfig: Record<string, HumanInterruptConfig> =
      Object.fromEntries(
        Object.entries(config.tools?.interrupt_config ?? {}).map(([k, v]) => {
          if (typeof v === "boolean") {
            return [
              k,
              {
                allow_accept: v,
                allow_respond: v,
                allow_edit: v,
                allow_ignore: v,
              } satisfies HumanInterruptConfig,
            ];
          }
          return [k, v as HumanInterruptConfig];
        }),
      );

    onPaste({
      name: name || "",
      description: description || "",
      systemPrompt: config.instructions || "",
      tools: config.tools?.tools || [],
      interruptConfig,
      triggers: config.triggers || [],
      subAgents,
    });

    toast.success("Agent configuration pasted successfully", {
      richColors: true,
    });
  } catch {
    toast.error(
      "Failed to paste configuration. Please ensure it's valid JSON format.",
      {
        richColors: true,
      },
    );
  }
}

export async function handlePasteConfigFromString(
  inputText: string,
  onPaste: (config: {
    name: string;
    description: string;
    systemPrompt: string;
    tools: string[];
    interruptConfig: Record<string, HumanInterruptConfig>;
    triggers: string[];
    subAgents: SubAgent[];
  }) => void,
): Promise<boolean> {
  try {
    const parsedConfig = JSON.parse(inputText);

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

    const subAgents: SubAgent[] = (config.subagents || []).map(
      (subAgent: SubAgentConfig) => ({
        name: subAgent.name || "",
        description: subAgent.description || "",
        prompt: subAgent.prompt || "",
        tools: subAgent.tools || [],
      }),
    );

    const interruptConfig: Record<string, HumanInterruptConfig> =
      Object.fromEntries(
        Object.entries(config.tools?.interrupt_config ?? {}).map(([k, v]) => {
          if (typeof v === "boolean") {
            return [
              k,
              {
                allow_accept: v,
                allow_respond: v,
                allow_edit: v,
                allow_ignore: v,
              } satisfies HumanInterruptConfig,
            ];
          }
          return [k, v as HumanInterruptConfig];
        }),
      );

    onPaste({
      name: name || "",
      description: description || "",
      systemPrompt: config.instructions || "",
      tools: config.tools?.tools || [],
      interruptConfig,
      triggers: config.triggers || [],
      subAgents,
    });

    toast.success("Agent configuration pasted successfully", {
      richColors: true,
    });

    return true;
  } catch {
    toast.error(
      "Failed to paste configuration. Please ensure it's valid JSON format.",
      {
        richColors: true,
      },
    );
  }

  return false;
}
