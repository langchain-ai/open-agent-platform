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
import { Bot, LoaderCircle, Trash, X, Copy, ClipboardPaste } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm } from "./agent-form";
import { Agent } from "@/types/agent";
import { FormProvider, useForm } from "react-hook-form";
import { useAuthContext } from "@/providers/Auth";
import { useTriggers } from "@/hooks/use-triggers";
import { useMCPContext } from "@/providers/MCP";
import { useLangChainAuth } from "@/hooks/use-langchain-auth";
import { ToolAuthRequiredAlert } from "./tool-auth-required-alert";
import { getDefaultsFromAgent, prepareConfigForSaving } from "./utils";
import { DeepAgentConfiguration } from "@/types/deep-agent";

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
  const auth = useAuthContext();
  const { tools } = useMCPContext();
  const { verifyUserAuthScopes, authRequiredUrls } = useLangChainAuth();
  const { updateAgentTriggers } = useTriggers();
  const { updateAgent, deleteAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const handleCopyConfig = async () => {
    const formData = form.getValues();
    const configToCopy = {
      name: formData.name,
      description: formData.description,
      config: formData.config,
    };

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(configToCopy, null, 2),
      );
      toast.success("Agent configuration copied to clipboard", {
        richColors: true,
      });
    } catch (error) {
      toast.error("Failed to copy configuration", {
        richColors: true,
      });
    }
  };

  const handlePasteConfig = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedConfig = JSON.parse(clipboardText);

      // Validate the structure
      if (typeof parsedConfig !== "object" || parsedConfig === null) {
        throw new Error("Invalid configuration format");
      }

      // Set form values
      if (parsedConfig.name) {
        form.setValue("name", parsedConfig.name);
      }
      if (parsedConfig.description) {
        form.setValue("description", parsedConfig.description);
      }
      if (parsedConfig.config && typeof parsedConfig.config === "object") {
        form.setValue("config", parsedConfig.config);
      }

      toast.success("Agent configuration pasted successfully", {
        richColors: true,
      });
    } catch (error) {
      toast.error(
        "Failed to paste configuration. Please ensure it's valid JSON format.",
        {
          richColors: true,
        },
      );
    }
  };

  const defaultConfigValues = getDefaultsFromAgent(agent);
  const form = useForm<{
    name: string;
    description: string;
    config: DeepAgentConfiguration;
  }>({
    defaultValues: {
      name: agent.name,
      description: (agent.metadata?.description as string | undefined) ?? "",
      config: defaultConfigValues,
    },
  });

  const handleSubmit = async (data: {
    name: string;
    description: string;
    config: DeepAgentConfiguration;
  }) => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }

    if (!data.name || !data.description) {
      toast.warning("Name and description are required");
      return;
    }

    // Check if the triggers have changed. Either the default triggers have changed, or if no
    // default exists, check if the trigger list is non-empty
    if (
      (defaultConfigValues.triggers?.length &&
        defaultConfigValues.triggers.some(
          (existingTrigger) =>
            !data.config?.triggers?.some(
              (newTrigger: string) => existingTrigger === newTrigger,
            ),
        )) ||
      (!defaultConfigValues.triggers?.length && data.config?.triggers?.length)
    ) {
      const selectedTriggerIds = data.config?.triggers ?? [];

      const success = await updateAgentTriggers(auth.session.accessToken, {
        agentId: agent.assistant_id,
        selectedTriggerIds,
        currentTriggerIds: defaultConfigValues.triggers ?? [],
      });
      if (!success) {
        toast.error("Failed to update agent triggers", {
          richColors: true,
        });
        return;
      }
    }

    const enabledToolNames = data.config.tools?.tools;
    if (enabledToolNames?.length) {
      const success = await verifyUserAuthScopes(auth.session.accessToken, {
        enabledToolNames,
        tools,
      });
      if (!success) {
        return;
      }
    }

    const updatedAgent = await updateAgent(
      agent.assistant_id,
      agent.deploymentId,
      {
        ...data,
        config: prepareConfigForSaving(data.config),
      },
    );

    if (!updatedAgent) {
      toast.error("Failed to update agent", {
        description: "Please try again",
        richColors: true,
      });
      return;
    }

    toast.success("Agent updated successfully!", {
      richColors: true,
    });

    onClose();
    refreshAgents();
  };

  const handleDelete = async () => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }

    setDeleteSubmitting(true);
    const deleted = await deleteAgent(agent.deploymentId, agent.assistant_id);
    setDeleteSubmitting(false);

    if (!deleted) {
      toast.error("Failed to delete agent", {
        description: "Please try again",
        richColors: true,
      });
      return;
    }

    if (defaultConfigValues.triggers?.length) {
      const success = await updateAgentTriggers(auth.session.accessToken, {
        agentId: agent.assistant_id,
        selectedTriggerIds: [],
        currentTriggerIds: defaultConfigValues.triggers ?? [],
      });
      if (!success) {
        toast.error("Failed to update agent triggers", {
          richColors: true,
        });
        return;
      }
    }

    toast.success("Agent deleted successfully!", {
      richColors: true,
    });

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyConfig}
                className="flex items-center gap-2"
              >
                <Copy className="size-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasteConfig}
                className="flex items-center gap-2"
              >
                <ClipboardPaste className="size-4" />
                Paste
              </Button>
              <AlertDialogCancel size="icon">
                <X className="size-4" />
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogHeader>
        <FormProvider {...form}>
          <AgentFieldsForm agentId={agent.assistant_id} />
        </FormProvider>
        {authRequiredUrls?.length ? (
          <ToolAuthRequiredAlert authRequiredUrls={authRequiredUrls} />
        ) : null}
        <AlertDialogFooter>
          <Button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-1"
            disabled={deleteSubmitting}
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
            disabled={form.formState.isSubmitting}
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
