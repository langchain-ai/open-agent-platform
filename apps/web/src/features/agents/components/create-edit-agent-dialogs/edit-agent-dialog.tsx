import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAgents } from "@/hooks/use-agents";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { Bot, LoaderCircle, Trash, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm, AgentFieldsFormLoading } from "./agent-form";
import { Agent } from "@/types/agent";
import { FormProvider, useForm } from "react-hook-form";
import { usePromptModes } from "@/hooks/use-prompt-modes";
import { useMCPContext } from "@/providers/MCP";
import {
  compileSystemPrompt,
  buildToolModeSelections,
} from "@/lib/prompt-compiler";

interface EditAgentDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditAgentDialogContent({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const { updateAgent, deleteAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const {
    getSchemaAndUpdateConfig,

    loading,
    configurations,
    toolConfigurations,
    ragConfigurations,
    agentsConfigurations,
  } = useAgentConfig();
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const form = useForm<{
    name: string;
    description: string;
    config: Record<string, any>;
  }>({ defaultValues: async () => getSchemaAndUpdateConfig(agent) });

  // Get prompt modes and tools
  const promptModes = usePromptModes(agent.assistant_id);
  const { tools } = useMCPContext();

  // Determine schema labels for system prompt and MCP config from current configurations
  const systemPromptLabel = useMemo(() => {
    const labels = new Set((configurations || []).map((c) => c.label));
    if (labels.has("systemPrompt")) return "systemPrompt";
    if (labels.has("system_prompt")) return "system_prompt";
    return undefined;
  }, [configurations]);

  const toolConfigLabel = useMemo(() => {
    return toolConfigurations[0]?.label;
  }, [toolConfigurations]);

  // Hydrate prompt modes from saved agent config; update only when different
  useEffect(() => {
    type AgentConfigurable = {
      mcp_config?: {
        tool_prompt_modes?: Record<string, string>;
      };
      system_prompt?: string;
    };

    const savedConfig = agent.config?.configurable as
      | AgentConfigurable
      | undefined;

    if (!savedConfig) return;

    // Compare and sync tool_prompt_modes
    const savedModes = savedConfig.mcp_config?.tool_prompt_modes || {};
    const currentModes = promptModes.promptModes || {};

    const savedKeys = Object.keys(savedModes);
    const currentKeys = Object.keys(currentModes);

    const modesDiffer =
      savedKeys.length !== currentKeys.length ||
      savedKeys.some((k) => currentModes[k] !== savedModes[k]);

    if (modesDiffer && savedKeys.length > 0) {
      for (const [toolName, templateKey] of Object.entries(savedModes)) {
        if (currentModes[toolName] !== templateKey) {
          promptModes.setToolPromptMode(toolName, templateKey);
        }
      }
    }

    // Load system prompt from schema-defined label if present
    const savedSystemPrompt = systemPromptLabel
      ? (savedConfig as any)[systemPromptLabel]
      : undefined;
    if (savedSystemPrompt && promptModes.customPrompt !== savedSystemPrompt) {
      promptModes.setCustomPrompt(savedSystemPrompt);

      // Determine if using compiled (has tool_prompt_modes) or custom
      const hasToolModes = savedKeys.length > 0;
      if (promptModes.useCompiled !== hasToolModes) {
        promptModes.setUseCompiled(hasToolModes);
      }
    }
  }, [
    agent.assistant_id,
    agent.config?.configurable,
    systemPromptLabel,
    promptModes.customPrompt,
    promptModes.useCompiled,
    promptModes.promptModes,
  ]);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    config: Record<string, any>;
  }) => {
    if (!data.name || !data.description) {
      toast.warning("Name and description are required");
      return;
    }

    // Prepare final config with prompt data
    const finalConfig = { ...data.config };

    // Add prompt modes if any are selected (under the MCP config schema label)
    if (Object.keys(promptModes.promptModes).length > 0 && toolConfigLabel) {
      finalConfig[toolConfigLabel] = {
        ...(finalConfig[toolConfigLabel] || {}),
        tool_prompt_modes: promptModes.promptModes,
      };
    }

    // Add system prompt if customized or compiled, targeting the schema-defined label
    if (systemPromptLabel && promptModes.customPrompt) {
      finalConfig[systemPromptLabel] = promptModes.customPrompt;
    } else if (
      systemPromptLabel &&
      Object.keys(promptModes.promptModes).length > 0
    ) {
      // Compile system prompt from selected modes
      try {
        const selectedTools = finalConfig[toolConfigLabel || ""]?.tools || [];
        const selections = buildToolModeSelections(
          tools,
          selectedTools,
          promptModes.promptModes,
        );
        const compiledPrompt = await compileSystemPrompt(selections);
        finalConfig[systemPromptLabel] = compiledPrompt;
      } catch (_error) {
        const errorMessage =
          _error instanceof Error ? _error.message : "Unknown error";
        toast.error("Failed to compile system prompt", {
          description: `${errorMessage}. The agent will be updated without a custom system prompt.`,
          richColors: true,
        });
      }
    }

    const updatedAgent = await updateAgent(
      agent.assistant_id,
      agent.deploymentId,
      {
        name: data.name,
        description: data.description,
        config: finalConfig,
      },
    );

    if (!updatedAgent) {
      toast.error("Failed to update agent", {
        description: "Please try again",
      });
      return;
    }

    toast.success("Agent updated successfully!");

    onClose();
    refreshAgents();
  };

  const handleDelete = async () => {
    setDeleteSubmitting(true);
    const deleted = await deleteAgent(agent.deploymentId, agent.assistant_id);
    setDeleteSubmitting(false);

    if (!deleted) {
      toast.error("Failed to delete agent", {
        description: "Please try again",
      });
      return;
    }

    toast.success("Agent deleted successfully!");

    onClose();
    refreshAgents();
  };

  return (
    <AlertDialogContent className="h-auto max-h-[90vh] overflow-auto sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <AlertDialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <AlertDialogTitle>Edit Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Edit the agent for &apos;
                <span className="font-medium">{agent.graph_id}</span>&apos;
                graph.
              </AlertDialogDescription>
            </div>
            <AlertDialogCancel size="icon">
              <X className="size-4" />
            </AlertDialogCancel>
          </div>
        </AlertDialogHeader>
        {loading ? (
          <AgentFieldsFormLoading />
        ) : (
          <FormProvider {...form}>
            <AgentFieldsForm
              configurations={configurations}
              toolConfigurations={toolConfigurations}
              agentId={agent.assistant_id}
              ragConfigurations={ragConfigurations}
              agentsConfigurations={agentsConfigurations}
            />
          </FormProvider>
        )}
        <AlertDialogFooter>
          <Button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-1"
            disabled={loading || deleteSubmitting}
            variant="destructive"
          >
            {deleteSubmitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Trash />
            )}
            <span>{deleteSubmitting ? "Deleting..." : "Delete Agent"}</span>
          </Button>
          <Button
            type="submit"
            className="flex w-full items-center justify-center gap-1"
            disabled={loading || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Bot />
            )}
            <span>
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </span>
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

export function EditAgentDialog({
  agent,
  open,
  onOpenChange,
}: EditAgentDialogProps) {
  const [openCounter, setOpenCounter] = useState(0);

  const lastOpen = useRef(open);
  useLayoutEffect(() => {
    if (lastOpen.current !== open && open) {
      setOpenCounter((c) => c + 1);
    }
    lastOpen.current = open;
  }, [open, setOpenCounter]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <EditAgentDialogContent
        key={openCounter}
        agent={agent}
        onClose={() => onOpenChange(false)}
      />
    </AlertDialog>
  );
}
