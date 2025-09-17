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
import { Bot, LoaderCircle, X, Copy, ClipboardPaste } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { AgentFieldsForm } from "./agent-form";
import { Deployment } from "@/types/deployment";
import { Agent } from "@/types/agent";
import { getDeployments } from "@/lib/environment/deployments";
import { GraphSelect } from "./graph-select";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { useAuthContext } from "@/providers/Auth";
import { useTriggers } from "@/hooks/use-triggers";
import { useMCPContext } from "@/providers/MCP";
import { useLangChainAuth } from "@/hooks/use-langchain-auth";
import _ from "lodash";
import { ToolAuthRequiredAlert } from "./tool-auth-required-alert";
import { AgentFormValues } from "./types";
import { DeepAgentConfiguration } from "@/types/deep-agent";
import {
  DEFAULT_FORM_CONFIG,
  prepareConfigForSaving,
  isValidDeepAgentConfiguration,
} from "./utils";

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
  onFormReady: (form: UseFormReturn<AgentFormValues>) => void;
}) {
  const { tools } = useMCPContext();
  const { verifyUserAuthScopes, authRequiredUrls } = useLangChainAuth();
  const auth = useAuthContext();
  const { setupAgentTrigger } = useTriggers();
  const form = useForm<AgentFormValues>({
    defaultValues: { name: "", description: "", config: DEFAULT_FORM_CONFIG },
  });

  const { createAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const [submitting, setSubmitting] = useState(false);

  // Expose form to parent component
  useEffect(() => {
    props.onFormReady(form);
  }, [form, props]);

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

    const { name, description, config } = data;
    if (!name || !description) {
      toast.warning("Name and description are required", {
        richColors: true,
      });
      return;
    }

    const enabledToolNames = config.tools?.tools;
    if (enabledToolNames?.length) {
      const success = await verifyUserAuthScopes(auth.session.accessToken, {
        enabledToolNames,
        tools,
      });
      if (!success) {
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
        config: prepareConfigForSaving(config),
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
      <FormProvider {...form}>
        <AgentFieldsForm agentId={props.selectedGraph.assistant_id} />
      </FormProvider>
      {authRequiredUrls?.length ? (
        <ToolAuthRequiredAlert authRequiredUrls={authRequiredUrls} />
      ) : null}
      <AlertDialogFooter>
        <Button
          onClick={(e) => {
            e.preventDefault();
            props.onClose();
          }}
          variant="outline"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex w-full items-center justify-center gap-1"
          disabled={submitting}
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
  const [formRef, setFormRef] = useState<UseFormReturn<AgentFormValues> | null>(
    null,
  );

  const handleCopyConfig = async () => {
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
      await navigator.clipboard.writeText(
        JSON.stringify(configToCopy, null, 2),
      );
      toast.success("Agent configuration copied to clipboard", {
        richColors: true,
      });
    } catch {
      toast.error("Failed to copy configuration", {
        richColors: true,
      });
    }
  };

  const handlePasteConfig = async () => {
    if (!formRef) return;

    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedConfig = JSON.parse(clipboardText);

      // Validate the structure
      if (typeof parsedConfig !== "object" || parsedConfig === null) {
        throw new Error("Invalid configuration format");
      }

      // Expect only the new agent structure format
      if (!(parsedConfig.metadata && parsedConfig.config?.configurable)) {
        throw new Error("Invalid configuration format");
      }

      const name = parsedConfig.name as string | undefined;
      const description = parsedConfig.metadata.description as
        | string
        | undefined;
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
  };

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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyConfig}
                className="flex items-center gap-2"
                disabled={!formRef}
              >
                <Copy className="size-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasteConfig}
                className="flex items-center gap-2"
                disabled={!formRef}
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
            onFormReady={setFormRef}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
