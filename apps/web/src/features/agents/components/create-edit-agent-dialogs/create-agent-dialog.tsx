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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAgents } from "@/hooks/use-agents";
import { Bot, LoaderCircle, X, ExternalLink, Copy, Info } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm, AgentFieldsFormLoading } from "./agent-form";
import { Deployment } from "@/types/deployment";
import { Agent } from "@/types/agent";
import { getDeployments } from "@/lib/environment/deployments";
import { GraphSelect } from "./graph-select";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { FormProvider, useForm } from "react-hook-form";
import { useAuthContext } from "@/providers/Auth";
import { useTriggers } from "@/hooks/use-triggers";
import { useMCPContext } from "@/providers/MCP";
import { useLangChainAuth } from "@/hooks/use-langchain-auth";
import _ from "lodash";

interface CreateAgentDialogProps {
  agentId?: string;
  deploymentId?: string;
  graphId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateAgentFormContent(props: {
  selectedGraph: Agent;
  selectedDeployment: Deployment;
  onClose: () => void;
}) {
  const { tools } = useMCPContext();
  const { verifyUserAuthScopes } = useLangChainAuth();
  const auth = useAuthContext();
  const { setupAgentTrigger } = useTriggers();
  const form = useForm<{
    name: string;
    description: string;
    config: Record<string, any>;
  }>({
    defaultValues: async () => {
      const values = await getSchemaAndUpdateConfig(props.selectedGraph);
      return { name: "", description: "", config: values.config };
    },
  });

  const { createAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const {
    getSchemaAndUpdateConfig,
    loading,
    configurations,
    toolConfigurations,
    ragConfigurations,
    agentsConfigurations,
    subAgentsConfigurations,
    triggersConfigurations,
  } = useAgentConfig();
  const [submitting, setSubmitting] = useState(false);
  const [authRequiredUrls, setAuthRequiredUrls] = useState<{
    provider: string,
    authUrl: string
  }[]>([]);

  const handleSubmit = async (data: {
    name: string;
    description: string;
    config: Record<string, any>;
  }) => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }

    const { name, description, config } = data;
    if (!name || !description) {
      toast.warning("Name and description are required", {
        richColors: true,
      });
      return;
    }

    const enabledToolNames = config.tools?.tools;
    if (enabledToolNames?.length) {
      const enabledTools = tools.filter((t) => enabledToolNames.includes(t.name));
      if (enabledTools.length !== enabledToolNames.length) {
        toast.error("One or more tools are not available", {
          richColors: true,
        });
        return;
      }

      const accessToken = auth.session.accessToken;

      const toolsAuthResPromise = enabledTools.map(async (tool) => {
        if (!tool.auth_provider || !tool.scopes?.length) {
          return true;
        }
        const authRes = await verifyUserAuthScopes(accessToken, {
          providerId: tool.auth_provider,
          scopes: tool.scopes,
        });
        if (typeof authRes === "string") {
          return {
            provider: tool.auth_provider,
            authUrl: authRes,
          };
        }
        return true;
      });

      const authUrls = (await Promise.all(toolsAuthResPromise)).filter((res) => typeof res === "object");
      if (authUrls.length) {
        toast.info("Please authenticate with the required tool providers.", {
          richColors: true,
        });

        setAuthRequiredUrls(authUrls);
        return;
      }
    }

    setSubmitting(true);
    const newAgent = await createAgent(
      props.selectedDeployment.id,
      props.selectedGraph.graph_id,
      {
        name,
        description,
        config,
      },
    );

    if (!newAgent) {
      toast.error("Failed to create agent", {
        description: "Please try again",
        richColors: true,
      });
      return;
    }

    if (config.triggers?.length) {
      const success = await setupAgentTrigger(auth.session.accessToken, {
        selectedTriggerIds: config.triggers,
        agentId: newAgent.assistant_id,
      });

      if (!success) {
        toast.error("Failed to set up triggers", {
          richColors: true,
        });
        return;
      }
    }

    setSubmitting(false);

    toast.success(
      `Agent${config?.triggers?.length ? " with triggers" : ""} created successfully!`,
      {
        richColors: true,
      },
    );

    props.onClose();
    // Do not await so that the refresh is non-blocking
    refreshAgents();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {loading ? (
        <AgentFieldsFormLoading />
      ) : (
        <FormProvider {...form}>
          <AgentFieldsForm
            agentId={props.selectedGraph.assistant_id}
            configurations={configurations}
            toolConfigurations={toolConfigurations}
            ragConfigurations={ragConfigurations}
            agentsConfigurations={agentsConfigurations}
            subAgentsConfigurations={subAgentsConfigurations}
            triggersConfigurations={triggersConfigurations}
          />
        </FormProvider>
      )}
      {authRequiredUrls?.length ? (
        <Alert variant="info" className="my-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            <p className="mb-3">Please authenticate with the following providers, then click "Create Agent" again.</p>
            <div className="space-y-3">
              {authRequiredUrls.map((url) => (
                <div key={url.provider} className="rounded-lg border border-blue-200 bg-blue-25 p-4 dark:border-blue-800 dark:bg-blue-950/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      {_.startCase(url.provider)}
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900 ml-4"
                      onClick={() => window.open(url.authUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Authenticate
                    </Button>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <code className="flex-1 rounded bg-blue-100 px-2 py-1 font-mono text-blue-800 dark:bg-blue-900 dark:text-blue-200 break-all whitespace-pre-wrap">
                      {url.authUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                      onClick={() => {
                        navigator.clipboard.writeText(url.authUrl);
                        toast.success("URL copied to clipboard", {
                          richColors: true,
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
      <AlertDialogFooter>
        <Button
          onClick={(e) => {
            e.preventDefault();
            props.onClose();
          }}
          variant="outline"
          disabled={loading || submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex w-full items-center justify-center gap-1"
          disabled={loading || submitting}
        >
          {submitting ? <LoaderCircle className="animate-spin" /> : <Bot />}
          <span>{submitting ? "Creating..." : "Create Agent"}</span>
        </Button>
      </AlertDialogFooter>
    </form>
  );
}

export function CreateAgentDialog({
  agentId,
  deploymentId,
  graphId,
  open,
  onOpenChange,
}: CreateAgentDialogProps) {
  const deployments = getDeployments();
  const { agents } = useAgentsContext();

  const [selectedDeployment, setSelectedDeployment] = useState<
    Deployment | undefined
  >();
  const [selectedGraph, setSelectedGraph] = useState<Agent | undefined>();

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
  }, [
    agentId,
    deploymentId,
    graphId,
    agents,
    deployments,
    selectedDeployment,
    selectedGraph,
  ]);

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
      <AlertDialogContent className="h-auto max-h-[90vh] overflow-auto sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
        <AlertDialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <AlertDialogTitle>Create Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new agent for &apos;
                <span className="font-medium">{selectedGraph?.graph_id}</span>
                &apos; graph.
              </AlertDialogDescription>
            </div>
            <AlertDialogCancel size="icon">
              <X className="size-4" />
            </AlertDialogCancel>
          </div>
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

        {selectedGraph && selectedDeployment ? (
          <CreateAgentFormContent
            key={`${openCounter}-${selectedGraph.assistant_id}`}
            selectedGraph={selectedGraph}
            selectedDeployment={selectedDeployment}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
