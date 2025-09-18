import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAgents } from "@/hooks/use-agents";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, LoaderCircle, Copy } from "lucide-react";
import TriggersInterface from "@/features/triggers";
import { cn } from "@/lib/utils";
import { SubAgentCreator } from "./components/sub-agents";
import { SubAgent } from "@/types/sub-agent";
import {
  AgentConfigurationForm,
  useAgentConfigurationForm,
} from "./components/agent-configuration-form";
import {
  AgentToolsForm,
  useAgentToolsForm,
} from "./components/agent-tools-form";
import {
  AgentSystemPromptForm,
  useAgentSystemPromptForm,
} from "./components/agent-system-prompt-form";
import { useAgentTriggersForm } from "./components/agent-triggers-form";
import { useForm as useReactHookForm } from "react-hook-form";
import { getDeployments } from "@/lib/environment/deployments";
import { Agent } from "@/types/agent";
import { DeepAgentConfiguration } from "@/types/deep-agent";
import { HumanInterruptConfig } from "@/types/inbox";
import { useLangChainAuth } from "@/hooks/use-langchain-auth";
import { useMCPContext } from "@/providers/MCP";
import { useTriggers } from "@/hooks/use-triggers";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { useFlags } from "launchdarkly-react-client-sdk";
import {
  GroupedTriggerRegistrationsByProvider,
  ListTriggerRegistrationsData,
  Trigger,
} from "@/types/triggers";
import { groupTriggerRegistrationsByProvider } from "@/lib/triggers";
import { AuthRequiredDialog } from "./components/auth-required-dialog";
import { handleCopyConfig, handlePasteConfigFromString } from "./utils";
import { PasteConfigDialog } from "./components/paste-config-dialog";

const sections = [
  {
    id: 1,
    title: "Configure",
    pageTitle: "Configure your agent",
    description: "Basic agent settings and configuration",
    completed: false,
  },
  {
    id: 2,
    title: "Triggers",
    description: "Set up triggers for your agent",
    completed: false,
  },
  {
    id: 3,
    title: "Tools",
    description: "Select the tools your agent should have access to",
    completed: false,
  },
  {
    id: 4,
    title: "Sub-agents",
    description: "Select or create sub-agents for your agent",
    completed: false,
  },
  {
    id: 5,
    title: "System Prompt",
    description: "Define the system prompt and sub-agents",
    completed: false,
  },
];

const getDefaultInterruptConfig = (
  interruptConfig?: Record<string, boolean | HumanInterruptConfig>,
): Record<string, HumanInterruptConfig> => {
  if (!interruptConfig) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(interruptConfig).map(([key, value]) => {
      if (typeof value === "boolean") {
        return [
          key,
          {
            allow_accept: value,
            allow_respond: value,
            allow_edit: value,
            allow_ignore: value,
          },
        ];
      }
      return [key, value];
    }),
  );
};

export function AgentCreatorSheet(props: {
  agent?: Agent;
  trigger: ReactNode;
}) {
  const { tools: mcpTools } = useMCPContext();
  const [open, setOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [seenSections, setSeenSections] = useState(new Set([1]));
  const { verifyUserAuthScopes, authRequiredUrls } = useLangChainAuth();

  useEffect(() => {
    setSeenSections((prev) => new Set([...prev, currentSection]));
  }, [currentSection]);

  const configurable = props.agent?.config.configurable as
    | DeepAgentConfiguration
    | undefined;
  const configurationForm = useAgentConfigurationForm({
    name: props.agent?.name ?? "",
    description: (props.agent?.metadata?.description ?? "") as string,
  });
  const toolsForm = useAgentToolsForm({
    tools: configurable?.tools?.tools ?? [],
    interruptConfig: getDefaultInterruptConfig(
      configurable?.tools?.interrupt_config,
    ),
  });
  const systemPromptForm = useAgentSystemPromptForm({
    systemPrompt: configurable?.instructions ?? "",
  });
  const triggersForm = useAgentTriggersForm({
    triggerIds: configurable?.triggers ?? [],
  });
  const subAgentsForm = useReactHookForm<{ subAgents: SubAgent[] }>({
    defaultValues: {
      subAgents: configurable?.subagents ?? [],
    },
  });

  const agentName = configurationForm.watch("name");
  const description = configurationForm.watch("description");
  const hasAgentConfig = !!agentName.trim();
  const systemPrompt = systemPromptForm.watch("systemPrompt");
  const subAgents = subAgentsForm.watch("subAgents") ?? [];
  const tools = toolsForm.watch("tools") ?? [];
  const interruptConfig = toolsForm.watch("interruptConfig") ?? {};
  const triggerIds = triggersForm.watch("triggerIds") ?? [];

  const auth = useAuthContext();
  const { createAgent, updateAgent, deleteAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const {
    listTriggers,
    listUserTriggers,
    updateAgentTriggers,
    setupAgentTrigger,
  } = useTriggers();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();

  const [triggers, setTriggers] = useState<Trigger[] | undefined>();
  const [registrations, setRegistrations] = useState<
    ListTriggerRegistrationsData[] | undefined
  >();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [triggersLoading, setTriggersLoading] = useState(true);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [authRequiredDialogOpen, setAuthRequiredDialogOpen] = useState(false);

  const groupedTriggers: GroupedTriggerRegistrationsByProvider | undefined =
    useMemo(() => {
      if (!registrations || !triggers) return undefined;
      return groupTriggerRegistrationsByProvider(registrations, triggers);
    }, [registrations, triggers]);

  useEffect(() => {
    if (showTriggersTab === false || showTriggersTab === undefined) {
      setTriggersLoading(false);
      return;
    }
    if (!auth.session?.accessToken) return;
    setTriggersLoading(true);
    Promise.all([
      listTriggers(auth.session.accessToken),
      listUserTriggers(auth.session.accessToken),
    ])
      .then(([t, r]) => {
        setTriggers(t);
        setRegistrations(r);
      })
      .finally(() => setTriggersLoading(false));
  }, [auth.session?.accessToken, showTriggersTab]);

  const handleCreateAgent = async () => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found");
      return;
    }

    const isConfigurationValid = await configurationForm.trigger();
    const isSystemPromptValid = await systemPromptForm.trigger();

    if (!isConfigurationValid || !isSystemPromptValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { name, description } = configurationForm.getValues();
    const { tools, interruptConfig: toolsInterruptConfig } =
      toolsForm.getValues();
    const { systemPrompt: currentSystemPrompt } = systemPromptForm.getValues();
    const { triggerIds } = triggersForm.getValues();

    if (!name.trim() || !currentSystemPrompt.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);

    try {
      const deployments = getDeployments();
      const defaultDeployment = deployments.find((d) => d.isDefault);

      if (!defaultDeployment) {
        toast.error("No default deployment found", {
          richColors: true,
        });
        return;
      }

      const defaultGraph = defaultDeployment.graphs.find((g) => g.isDefault);
      if (!defaultGraph) {
        toast.error("No default graph found", {
          richColors: true,
        });
        return;
      }

      const enabledToolNames = tools;
      if (enabledToolNames?.length) {
        const success = await verifyUserAuthScopes(auth.session.accessToken, {
          enabledToolNames: enabledToolNames,
          tools: mcpTools,
        });
        if (!success) {
          setAuthRequiredDialogOpen(true);
          return;
        }
      }

      const defaultDeploymentId = defaultDeployment.id;
      const defaultGraphId = defaultGraph.id;

      const config: DeepAgentConfiguration = {
        tools: {
          tools: tools ?? [],
          interrupt_config: toolsInterruptConfig ?? {},
          url: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
          auth_required: process.env.NEXT_PUBLIC_SUPABASE_AUTH_MCP === "true",
        },
        triggers: triggerIds ?? [],
        instructions: currentSystemPrompt,
        subagents: subAgents,
      };

      const newAgent = await createAgent(defaultDeploymentId, defaultGraphId, {
        name,
        description,
        config,
      });

      if (!newAgent) {
        toast.error("Failed to create agent", {
          richColors: true,
        });
        return;
      }

      if (triggerIds.length) {
        const success = await setupAgentTrigger(auth.session.accessToken, {
          agentId: newAgent.assistant_id,
          selectedTriggerIds: triggerIds,
        });
        if (!success) {
          toast.error("Failed to add agent triggers", {
            richColors: true,
          });
          return;
        }
      }

      toast.success("Agent created successfully!", {
        richColors: true,
      });

      refreshAgents();

      setOpen(false);
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent", {
        richColors: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!props.agent) {
      toast.error("No agent found", {
        richColors: true,
      });
      return;
    }
    if (!auth.session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }

    try {
      setIsUpdating(true);
      const { name, description } = configurationForm.getValues();
      const { tools, interruptConfig: toolsInterruptConfig } =
        toolsForm.getValues();
      const { systemPrompt: currentSystemPrompt } =
        systemPromptForm.getValues();
      const { subAgents } = subAgentsForm.getValues();
      const { triggerIds } = triggersForm.getValues();

      if (!name) {
        toast.warning("Name is required");
        return;
      }

      // Check if the triggers have changed. Either the default triggers have changed, or if no
      // default exists, check if the trigger list is non-empty
      const agentConfigurable = props.agent.config.configurable as
        | DeepAgentConfiguration
        | undefined;
      const existingTriggerConfig = agentConfigurable?.triggers;
      if (
        (existingTriggerConfig?.length &&
          existingTriggerConfig.some(
            (existingTrigger) =>
              !triggerIds?.some((newTrigger) => existingTrigger === newTrigger),
          )) ||
        (!existingTriggerConfig?.length && triggerIds?.length)
      ) {
        const selectedTriggerIds = triggerIds ?? [];

        const success = await updateAgentTriggers(auth.session.accessToken, {
          agentId: props.agent.assistant_id,
          selectedTriggerIds,
        });
        if (!success) {
          toast.error("Failed to update agent triggers", {
            richColors: true,
          });
          return;
        }
      }

      const data: DeepAgentConfiguration = {
        tools: {
          url: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
          auth_required: process.env.NEXT_PUBLIC_SUPABASE_AUTH_MCP === "true",
          tools,
          interrupt_config: toolsInterruptConfig ?? {},
        },
        triggers: triggerIds ?? [],
        instructions: currentSystemPrompt,
        subagents: subAgents,
      };

      const enabledToolNames = tools;
      if (enabledToolNames?.length) {
        const success = await verifyUserAuthScopes(auth.session.accessToken, {
          enabledToolNames: enabledToolNames,
          tools: mcpTools,
        });
        if (!success) {
          setAuthRequiredDialogOpen(true);
          return;
        }
      }

      const updatedAgent = await updateAgent(
        props.agent.assistant_id,
        props.agent.deploymentId,
        {
          name,
          description,
          config: data,
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

      refreshAgents();
      setOpen(false);
    } catch (error) {
      console.error("Failed to update agent", error);
      toast.error("Failed to update agent", {
        richColors: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }
    if (!props.agent) {
      toast.error("No agent found", {
        richColors: true,
      });
      return;
    }

    setDeleteSubmitting(true);
    const deleted = await deleteAgent(
      props.agent.deploymentId,
      props.agent.assistant_id,
    );
    setDeleteSubmitting(false);

    if (!deleted) {
      toast.error("Failed to delete agent", {
        description: "Please try again",
        richColors: true,
      });
      return;
    }

    const configurable = props.agent.config.configurable as
      | DeepAgentConfiguration
      | undefined;
    if (configurable?.triggers?.length) {
      const success = await updateAgentTriggers(auth.session.accessToken, {
        agentId: props.agent.assistant_id,
        selectedTriggerIds: [],
        currentTriggerIds: configurable.triggers ?? [],
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

    refreshAgents();
    setOpen(false);
  };

  const handleSubAgentChange = (updatedSubAgents: SubAgent[]) => {
    subAgentsForm.setValue("subAgents", updatedSubAgents, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleCopy = () => {
    handleCopyConfig({
      name: agentName || "",
      description: description || "",
      systemPrompt: systemPrompt || "",
      tools: tools || [],
      interruptConfig: interruptConfig || {},
      triggers: triggerIds || [],
      subAgents: subAgents || [],
    });
  };

  const handlePasteSubmit = async (text: string): Promise<boolean> => {
    return await handlePasteConfigFromString(text, (config) => {
      configurationForm.setValue("name", config.name);
      configurationForm.setValue("description", config.description);
      systemPromptForm.setValue("systemPrompt", config.systemPrompt);
      toolsForm.setValue("tools", config.tools);
      toolsForm.setValue("interruptConfig", config.interruptConfig, {
        shouldDirty: true,
      });
      triggersForm.setValue("triggerIds", config.triggers);
      subAgentsForm.setValue("subAgents", config.subAgents);
    });
  };

  const handleResetForms = () => {
    configurationForm.reset();
    toolsForm.reset();
    systemPromptForm.reset();
    triggersForm.reset();
    subAgentsForm.reset({
      subAgents: [],
    });
    setCurrentSection(1);
    setIsCreating(false);
    setSeenSections(new Set([1]));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      handleResetForms();
    }
  };

  const canNavigateToSection = (sectionId: number): boolean => {
    if (props.agent) {
      // If the agent is defined, it means we're editing and users should be able to navigate freely
      return true;
    }
    if (sectionId === 1 && !hasAgentConfig) {
      return false;
    }
    if (seenSections.has(sectionId)) {
      return true;
    }
    return false;
  };

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SheetTrigger asChild>{props.trigger}</SheetTrigger>
      <SheetContent
        className="min-w-[85%] gap-0"
        hideClose={true}
      >
        <SheetHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <SheetClose className="cursor-pointer">
              <ArrowLeft className="size-3.5 text-gray-600" />
            </SheetClose>
            <SheetTitle className="text-sm font-medium">
              {props.agent ? (
                <span>
                  Edit agent •{" "}
                  <span className="text-accent-foreground font-light">
                    {props.agent.name}
                  </span>
                </span>
              ) : (
                "Create new agent"
              )}
            </SheetTitle>
          </div>

          <div className="flex gap-2">
            <SheetClose asChild>
              <Button
                disabled={isCreating || deleteSubmitting || isUpdating}
                variant="outline"
              >
                Cancel
              </Button>
            </SheetClose>
            {props.agent && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isCreating || deleteSubmitting || isUpdating}
              >
                {deleteSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            )}
            <Button
              disabled={
                (!props.agent && currentSection !== 5) ||
                !agentName.trim() ||
                !systemPrompt.trim() ||
                isCreating ||
                deleteSubmitting ||
                isUpdating
              }
              onClick={props.agent ? handleUpdateAgent : handleCreateAgent}
            >
              {isCreating ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  {props.agent ? "Updating" : "Creating"}...
                </>
              ) : props.agent ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </SheetHeader>

        <div className="bg-muted/50 flex h-full w-full flex-row">
          <div className="flex flex-col p-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "rounded p-4",
                  currentSection === section.id ? "bg-gray-100" : "",
                  canNavigateToSection(section.id)
                    ? "cursor-pointer"
                    : "cursor-default",
                )}
                onClick={() => {
                  if (canNavigateToSection(section.id)) {
                    setCurrentSection(section.id);
                  }
                }}
              >
                <span className="flex items-center gap-6">
                  <span
                    className={cn(
                      "text-base font-light",
                      currentSection === section.id
                        ? "text-gray-500"
                        : "text-gray-300",
                    )}
                  >
                    {section.id}
                  </span>
                  <span>
                    <h3
                      className={cn(
                        "text-base font-normal",
                        currentSection === section.id
                          ? "text-black"
                          : "text-black",
                      )}
                    >
                      {section.title}
                    </h3>
                  </span>
                </span>
              </div>
            ))}

            <div className="mt-auto px-4 pb-4">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex w-full items-center justify-center gap-2"
                >
                  <Copy className="size-4" />
                  Copy
                </Button>
                <PasteConfigDialog onSubmit={handlePasteSubmit} />
              </div>
            </div>
          </div>

          <div className="bg-background m-3 flex w-full flex-col rounded-2xl p-3">
            <div className="flex-1 p-6">
              <div className="mx-auto">
                <div className="space-y-8">
                  {currentSection === 1 && (
                    <AgentConfigurationForm form={configurationForm} />
                  )}

                  {currentSection === 2 && (
                    <div className="space-y-4">
                      <div className="mb-6">
                        <h2 className="text-md font- mb-2">Triggers</h2>
                        <p className="text-muted-foreground">
                          Set up triggers for your agent
                        </p>
                      </div>
                      <div className="scrollbar-pretty-auto max-h-[60vh] pr-2">
                        <TriggersInterface
                          groupedTriggers={groupedTriggers}
                          loading={triggersLoading}
                          showTriggersTab={showTriggersTab}
                          form={triggersForm}
                          hideHeader={true}
                        />
                      </div>
                    </div>
                  )}

                  {currentSection === 3 && <AgentToolsForm form={toolsForm} />}

                  {currentSection === 4 && (
                    <SubAgentCreator
                      subAgents={subAgents}
                      onSubAgentChange={handleSubAgentChange}
                    />
                  )}

                  {currentSection === 5 && (
                    <AgentSystemPromptForm form={systemPromptForm} />
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-end">
                <div className="flex gap-2">
                  {currentSection !== 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentSection(currentSection - 1)}
                      className="border-gray-300 bg-white text-black hover:bg-gray-50"
                    >
                      Back
                    </Button>
                  )}
                  {currentSection !== 5 && (
                    <Button
                      onClick={() => {
                        setCurrentSection((prev) =>
                          prev !== 5 ? prev + 1 : prev,
                        );
                      }}
                      disabled={currentSection === 1 && !agentName.trim()}
                    >
                      {currentSection === 1
                        ? "Configure triggers →"
                        : currentSection === 2
                          ? "Configure tools →"
                          : currentSection === 3
                            ? "Configure sub-agents →"
                            : "Configure system prompt →"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
      <AuthRequiredDialog
        open={authRequiredDialogOpen}
        onOpenChange={setAuthRequiredDialogOpen}
        authUrls={authRequiredUrls}
        handleSubmit={() => {
          setAuthRequiredDialogOpen(false);
          if (props.agent) {
            handleUpdateAgent();
          } else {
            handleCreateAgent();
          }
        }}
      />
    </Sheet>
  );
}
