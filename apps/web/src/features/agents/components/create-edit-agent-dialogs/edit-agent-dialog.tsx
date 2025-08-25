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
import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm, AgentFieldsFormLoading } from "./agent-form";
import { Agent } from "@/types/agent";
import { FormProvider, useForm } from "react-hook-form";

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
    subAgentsConfigurations,
  } = useAgentConfig();
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const form = useForm<{
    name: string;
    description: string;
    config: Record<string, any>;
  }>({ defaultValues: async () => getSchemaAndUpdateConfig(agent) });

  const handleSubmit = async (data: {
    name: string;
    description: string;
    config: Record<string, any>;
  }) => {
    if (!data.name || !data.description) {
      toast.warning("Name and description are required");
      return;
    }

    const updatedAgent = await updateAgent(
      agent.assistant_id,
      agent.deploymentId,
      data,
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
              subAgentsConfigurations={subAgentsConfigurations}
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
