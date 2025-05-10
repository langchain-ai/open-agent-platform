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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm, AgentFieldsFormLoading } from "./agent-form";
import { Agent } from "@/types/agent";

interface EditAgentDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAgentDialog({
  agent,
  open,
  onOpenChange,
}: EditAgentDialogProps) {
  const { updateAgent, deleteAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const {
    getSchemaAndUpdateConfig,
    configurations,
    toolConfigurations,
    ragConfigurations,
    agentsConfigurations,
    config,
    setConfig,
    loading,
    setLoading,
    name,
    setName,
    description,
    setDescription,
    clearState: clearAgentConfigState,
  } = useAgentConfig();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      loading ||
      configurations.length > 0 ||
      !open
    )
      return;

    getSchemaAndUpdateConfig(agent);
  }, [agent, open]);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    if (!name || !description) {
      toast.warning("Name and description are required");
      return;
    }

    setSubmitting(true);
    const updatedAgent = await updateAgent(
      agent.assistant_id,
      agent.deploymentId,
      {
        name,
        description,
        config,
      },
    );
    setSubmitting(false);

    if (!updatedAgent) {
      toast.error("Failed to update agent", {
        description: "Please try again",
      });
      return;
    }

    toast.success("Agent updated successfully!");

    onOpenChange(false);
    clearState();
    // Do not await so that the refresh is non-blocking
    refreshAgents();
  };

  const handleDelete = async () => {
    setSubmitting(true);
    const deleted = await deleteAgent(agent.deploymentId, agent.assistant_id);
    setSubmitting(false);

    if (!deleted) {
      toast.error("Failed to delete agent", {
        description: "Please try again",
      });
      return;
    }

    toast.success("Agent deleted successfully!");

    onOpenChange(false);
    clearState();
    // Do not await so that the refresh is non-blocking
    refreshAgents();
  };

  const clearState = () => {
    clearAgentConfigState();
    setLoading(false);
    setSubmitting(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(c) => {
        onOpenChange(c);
        if (!c) {
          clearState();
        }
      }}
    >
      <AlertDialogContent className="h-auto max-h-[90vh] overflow-auto sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <AlertDialogTitle>Edit Agent</AlertDialogTitle>
            <AlertDialogCancel>
              <X className="size-4" />
            </AlertDialogCancel>
          </div>
          <AlertDialogDescription>
            Edit the agent for &apos;
            <span className="font-medium">{agent.graph_id}</span>&apos; graph.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {loading ? (
          <AgentFieldsFormLoading />
        ) : (
          <AgentFieldsForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            configurations={configurations}
            toolConfigurations={toolConfigurations}
            config={config}
            setConfig={setConfig}
            agentId={agent.assistant_id}
            ragConfigurations={ragConfigurations}
            agentsConfigurations={agentsConfigurations}
          />
        )}
        <AlertDialogFooter>
          <Button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-1"
            disabled={loading || submitting}
            variant="destructive"
          >
            {submitting ? <LoaderCircle className="animate-spin" /> : <Trash />}
            <span>{submitting ? "Deleting..." : "Delete Agent"}</span>
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-1"
            disabled={loading || submitting}
          >
            {submitting ? <LoaderCircle className="animate-spin" /> : <Bot />}
            <span>{submitting ? "Saving..." : "Save Changes"}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
