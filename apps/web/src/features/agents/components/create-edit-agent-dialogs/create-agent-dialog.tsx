import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAgents } from "@/hooks/use-agents";
import { Bot, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm, AgentFieldsFormLoading } from "./agent-form";
import { Deployment } from "@/types/deployment";
import { Agent } from "@/types/agent";
import { getDeployments } from "@/lib/environment/deployments";
import { GraphSelect } from "./graph-select";
import { useAgentConfig } from "@/hooks/use-agent-config";

interface CreateAgentDialogProps {
  agentId?: string;
  deploymentId?: string;
  graphId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAgentDialog({
  agentId,
  deploymentId,
  graphId,
  open,
  onOpenChange,
}: CreateAgentDialogProps) {
  const deployments = getDeployments();
  const { createAgent } = useAgents();
  const { refreshAgents, agents } = useAgentsContext();
  const {
    getSchemaAndUpdateConfig,
    configurations,
    toolConfigurations,
    ragConfigurations,
    agentsConfigurations,
    config,
    setConfig,
    loading,
    name,
    setName,
    description,
    setDescription,
    clearState: clearAgentConfigState,
  } = useAgentConfig();
  const [submitting, setSubmitting] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment>();
  // Use the default agent as the selected graph.
  const [selectedGraph, setSelectedGraph] = useState<Agent>();

  useEffect(() => {
    if (selectedDeployment || selectedGraph) return;
    if (agentId && deploymentId && graphId) {
      // Find the deployment & default agent, then set them
      const deployment = deployments.find((d) => d.id === deploymentId);
      const defaultAgent = agents.find(
        (a) => a.assistant_id === agentId && a.deploymentId === deploymentId,
      );
      if (!deployment || !defaultAgent) {
        toast.error("Something went wrong. Please try again.", {
          richColors: true,
        });
        return;
      }

      setSelectedDeployment(deployment);
      setSelectedGraph(defaultAgent);
    }
  }, [agentId, deploymentId, graphId, agents, deployments]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      loading ||
      !open ||
      !selectedGraph ||
      !selectedDeployment
    )
      return;

    getSchemaAndUpdateConfig(selectedGraph, {
      isCreate: true,
    });
  }, [selectedGraph, selectedDeployment, open]);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    if (!name || !description) {
      toast.warning("Name and description are required", {
        richColors: true,
      });
      return;
    }
    if (!selectedGraph || !selectedDeployment) {
      toast.error("Failed to create agent", {
        description: "Please try again",
        richColors: true,
      });
      return;
    }

    setSubmitting(true);
    const newAgent = await createAgent(
      selectedDeployment.id,
      selectedGraph.graph_id,
      {
        name,
        description,
        config,
      },
    );
    setSubmitting(false);

    if (!newAgent) {
      toast.error("Failed to create agent", {
        description: "Please try again",
        richColors: true,
      });
      return;
    }

    toast.success("Agent created successfully!", {
      richColors: true,
    });

    onOpenChange(false);
    clearState();
    // Do not await so that the refresh is non-blocking
    refreshAgents();
  };

  const clearState = () => {
    clearAgentConfigState();
    setSelectedDeployment(undefined);
    setSelectedGraph(undefined);
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
          <AlertDialogTitle>Create Agent</AlertDialogTitle>
          <AlertDialogDescription>
            Create a new agent for &apos;
            <span className="font-medium">{selectedGraph?.graph_id}</span>&apos;
            graph.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!agentId && !graphId && !deploymentId && (
          <div className="flex flex-col items-start justify-start gap-2">
            <p>Please select a graph to create an agent for.</p>
            <GraphSelect
              className="w-full"
              agents={agents}
              selectedGraph={selectedGraph}
              setSelectedGraph={setSelectedGraph}
              selectedDeployment={selectedDeployment}
              setSelectedDeployment={setSelectedDeployment}
            />
          </div>
        )}
        {loading ? (
          <AgentFieldsFormLoading />
        ) : selectedGraph && selectedDeployment ? (
          <AgentFieldsForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            configurations={configurations}
            toolConfigurations={toolConfigurations}
            config={config}
            setConfig={setConfig}
            agentId={selectedGraph.assistant_id}
            ragConfigurations={ragConfigurations}
            agentsConfigurations={agentsConfigurations}
          />
        ) : null}
        <AlertDialogFooter>
          <Button
            onClick={(e) => {
              e.preventDefault();
              clearState();
              onOpenChange(false);
            }}
            variant="outline"
            disabled={loading || submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => handleSubmit(e)}
            className="flex w-full items-center justify-center gap-1"
            disabled={loading || submitting}
          >
            {submitting ? <LoaderCircle className="animate-spin" /> : <Bot />}
            <span>{submitting ? "Creating..." : "Create Agent"}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
