"use client";

import React, { useState } from "react";
import { Agent } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Zap, Users, ArrowRight, Wrench, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import { CreateAgentToolsSelection } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import { cn } from "@/lib/utils";
import TriggersInterface from "@/features/triggers";
import { useTriggers } from "@/hooks/use-triggers";
import {
  useAgentTriggersForm,
  AgentTriggersFormData,
} from "@/components/agent-creator-sheet/components/agent-triggers-form";
import {
  useAgentToolsForm,
  AgentToolsFormValues,
} from "@/components/agent-creator-sheet/components/agent-tools-form";
import type { UseFormReturn } from "react-hook-form";
import { useMemo, useEffect } from "react";
import { groupTriggerRegistrationsByProvider } from "@/lib/triggers";
import { useFlags } from "launchdarkly-react-client-sdk";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import {
  GroupedTriggerRegistrationsByProvider,
  ListTriggerRegistrationsData,
  Trigger,
} from "@/types/triggers";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
// Using inline Tailwind classes with arbitrary selectors for BlockNote styling
import { SubAgentCreator } from "@/components/agent-creator-sheet/components/sub-agents";
import { SubAgent } from "@/types/sub-agent";
import { useForm as useReactHookForm } from "react-hook-form";
import { EditTarget } from "@/components/AgentHierarchyNav";
import { DeepAgentConfiguration } from "@/types/deep-agent";
import { HumanInterruptConfig } from "@/types/inbox";

interface AgentConfigProps {
  agent: Agent | null;
  editTarget?: EditTarget;
  onAgentUpdated?: () => Promise<void>;
  view?: ViewType;
  onViewChange?: (view: ViewType) => void;
  hideTopTabs?: boolean;
  toolsFormExternal?: UseFormReturn<AgentToolsFormValues>;
  triggersFormExternal?: UseFormReturn<AgentTriggersFormData>;
  hideTriggersTab?: boolean;
  hideToolsTab?: boolean;
}

type ViewType = "instructions" | "tools" | "triggers" | "subagents";

export function AgentConfig({
  agent,
  editTarget,
  onAgentUpdated,
  view: externalView,
  onViewChange,
  hideTopTabs,
  toolsFormExternal,
  triggersFormExternal,
  hideTriggersTab,
  hideToolsTab,
}: AgentConfigProps) {
  const { session } = useAuthContext();
  const {
    listTriggers,
    listUserTriggers,
    updateAgentTriggers,
    listAgentTriggers,
  } = useTriggers();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();

  // Extract data based on edit target
  const isEditingSubAgent = editTarget?.type === "subagent";
  // Always derive the current sub-agent from the latest agent data using the index,
  // not from the stale object on editTarget, so UI reflects saved updates immediately.
  const currentSubAgent: SubAgent | null = isEditingSubAgent
    ? ((agent?.config?.configurable?.subagents as SubAgent[])?.[
        editTarget.index
      ] ?? null)
    : null;

  const subAgents =
    (agent?.config?.configurable?.subagents as SubAgent[]) || [];

  const baseViews: ViewType[] = isEditingSubAgent
    ? ["instructions", "tools"]
    : ["instructions", "tools", "triggers"];
  const availableViews: ViewType[] = React.useMemo(() => {
    let v = [...baseViews];
    if (hideTriggersTab) v = v.filter((x) => x !== "triggers");
    if (hideToolsTab) v = v.filter((x) => x !== "tools");
    return v;
  }, [isEditingSubAgent, hideTriggersTab, hideToolsTab]);

  const [internalView, setInternalView] = useState<ViewType>("instructions");
  const currentView = externalView ?? internalView;
  const setCurrentView = (v: ViewType) => {
    if (onViewChange) onViewChange(v);
    else setInternalView(v);
  };
  const [editedTitle, setEditedTitle] = useState("");
  const [initialTitle, setInitialTitle] = useState("");
  const [editedTools, setEditedTools] = useState<string[]>([]);
  const [editedInterruptConfig, setEditedInterruptConfig] = useState<
    Record<string, HumanInterruptConfig>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isInstructionsDirty, setIsInstructionsDirty] = useState(false);

  // Create tools form to track changes
  const toolsFormInternal = useAgentToolsForm({
    tools: editedTools,
    interruptConfig: editedInterruptConfig,
  });
  const toolsForm = toolsFormExternal ?? toolsFormInternal;

  // Create sub-agents form to track changes
  const subAgentsForm = useReactHookForm<{ subAgents: SubAgent[] }>({
    defaultValues: {
      subAgents: subAgents,
    },
  });

  const editorKey = `${agent?.assistant_id}-${isEditingSubAgent ? `subagent-${editTarget?.type === "subagent" ? editTarget.index : 0}` : "main"}`;
  const editor = useCreateBlockNote({
    initialContent: undefined,
    onFocus: () => {
      // Prevent keyboard shortcuts from bubbling up when editor is focused
    },
  });

  // Triggers state
  const [triggers, setTriggers] = useState<Trigger[] | undefined>();
  const [registrations, setRegistrations] = useState<
    ListTriggerRegistrationsData[] | undefined
  >();
  const [triggersLoading, setTriggersLoading] = useState(true);

  const triggersFormInternal = useAgentTriggersForm({
    triggerIds: [],
  });
  const triggersForm = triggersFormExternal ?? triggersFormInternal;

  const groupedTriggers: GroupedTriggerRegistrationsByProvider | undefined =
    useMemo(() => {
      if (!registrations || !triggers) return undefined;
      return groupTriggerRegistrationsByProvider(registrations, triggers);
    }, [registrations, triggers]);

  // Load triggers data
  useEffect(() => {
    if (showTriggersTab === false || showTriggersTab === undefined) {
      setTriggersLoading(false);
      return;
    }
    if (!session?.accessToken || !agent) return;

    setTriggersLoading(true);
    Promise.all([
      listTriggers(session.accessToken),
      listUserTriggers(session.accessToken),
    ])
      .then(async ([t, r]) => {
        setTriggers(t);
        setRegistrations(r);

        if (agent && session?.accessToken) {
          const agentTriggerIds = await listAgentTriggers(
            session.accessToken,
            agent.assistant_id,
          );
          triggersForm.setValue("triggerIds", agentTriggerIds);
        }
      })
      .finally(() => setTriggersLoading(false));
  }, [session?.accessToken, showTriggersTab, agent]);

  // Update edited values when edit target changes (not on every render)
  React.useEffect(() => {
    // Get fresh values each time we switch edit targets
    const freshTitle = isEditingSubAgent
      ? currentSubAgent?.name || "Untitled Sub-agent"
      : agent?.name || "Untitled Agent";
    const freshTools = isEditingSubAgent
      ? currentSubAgent?.tools || []
      : (agent?.config?.configurable as DeepAgentConfiguration | undefined)
          ?.tools?.tools || [];
    const freshInterruptConfig = isEditingSubAgent
      ? (
          currentSubAgent as {
            interrupt_config?: Record<string, HumanInterruptConfig>;
          }
        )?.interrupt_config || {}
      : (
          agent?.config?.configurable?.tools as {
            interrupt_config?: Record<string, HumanInterruptConfig>;
          }
        )?.interrupt_config || {};

    setEditedTitle(freshTitle);
    setInitialTitle(freshTitle);
    setEditedTools([...freshTools]);
    setEditedInterruptConfig({ ...(freshInterruptConfig || {}) });

    toolsForm.reset({
      tools: freshTools,
      interruptConfig: freshInterruptConfig,
    });

    subAgentsForm.reset({
      subAgents: subAgents,
    });

    // Reset dirty flags when switching targets
    setIsInstructionsDirty(false);
  }, [
    agent?.assistant_id,
    editTarget?.type,
    editTarget?.type === "subagent" ? editTarget.index : null,
    agent?.config?.configurable?.subagents,
    toolsForm,
    subAgentsForm,
  ]);

  React.useEffect(() => {
    const updateEditorContent = async () => {
      const currentInstructions = isEditingSubAgent
        ? currentSubAgent?.prompt || "No instructions provided"
        : agent?.config?.configurable?.instructions ||
          "No instructions provided";

      if (
        currentInstructions &&
        currentInstructions !== "No instructions provided"
      ) {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(
            currentInstructions as string,
          );
          editor.replaceBlocks(editor.document, blocks);
        } catch (error) {
          console.error("Error parsing markdown to blocks:", error);
          // Fallback to empty editor
          editor.replaceBlocks(editor.document, [
            {
              id: "default",
              type: "paragraph",
              props: {},
              content: "",
              children: [],
            },
          ]);
        }
      } else {
        editor.replaceBlocks(editor.document, [
          {
            id: "default",
            type: "paragraph",
            props: {},
            content: "",
            children: [],
          },
        ]);
      }
    };

    updateEditorContent();
  }, [
    agent?.assistant_id,
    editTarget?.type,
    editTarget?.type === "subagent" ? editTarget.index : null,
    editor,
  ]);

  React.useEffect(() => {
    setCurrentView("instructions");
  }, [editTarget]);

  const handleCopy = async () => {
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      await navigator.clipboard.writeText(markdown);
      toast.success("Instructions copied to clipboard");
    } catch {
      toast.error("Failed to copy instructions");
    }
  };

  const reloadTriggers = async () => {
    if (!session?.accessToken) {
      toast.error("No access token found");
      return;
    }
    try {
      const [triggersList, userTriggersList] = await Promise.all([
        listTriggers(session.accessToken),
        listUserTriggers(session.accessToken),
      ]);
      setTriggers(triggersList);
      setRegistrations(userTriggersList);
    } catch {
      toast.error("Failed to load triggers");
    }
  };

  const handleSaveChanges = async () => {
    if (!agent || !session?.accessToken) {
      toast.error("Unable to save: missing agent or authentication");
      return;
    }

    setIsSaving(true);

    try {
      // Only update triggers if we're editing the main agent (not sub-agents)
      if (!isEditingSubAgent) {
        const triggerIds = triggersForm.getValues().triggerIds || [];
        const currentTriggerIds = await listAgentTriggers(
          session.accessToken,
          agent.assistant_id,
        );

        // Check if there are any differences between current and selected triggers
        const hasTriggersChanges =
          currentTriggerIds.length !== triggerIds.length ||
          currentTriggerIds.some((id) => !triggerIds.includes(id)) ||
          triggerIds.some((id) => !currentTriggerIds.includes(id));

        if (hasTriggersChanges) {
          const success = await updateAgentTriggers(session.accessToken, {
            agentId: agent.assistant_id,
            selectedTriggerIds: triggerIds,
            currentTriggerIds,
          });
          if (!success) {
            toast.error("Failed to update agent triggers");
            return;
          }
        }
      }

      // Create client for the agent's deployment
      const client = createClient(agent.deploymentId, session.accessToken);

      // Get current values from forms and editor
      const instructionsMarkdown = await editor.blocksToMarkdownLossy(
        editor.document,
      );
      const { tools: currentTools, interruptConfig: currentInterruptConfig } =
        toolsForm.getValues();

      if (isEditingSubAgent && editTarget && currentSubAgent) {
        // Update the specific sub-agent
        const updatedSubAgent: SubAgent = {
          ...currentSubAgent,
          name: editedTitle,
          prompt: instructionsMarkdown,
          tools: currentTools,
        };

        // Update the sub-agents array in the main agent
        const currentSubAgents =
          (agent?.config?.configurable?.subagents as SubAgent[]) || [];
        let updatedSubAgents = currentSubAgents.map((sa, index) =>
          index === editTarget.index ? updatedSubAgent : sa,
        );
        // Ensure required mcp_server is present
        updatedSubAgents = updatedSubAgents.map((sa) => ({
          ...sa,
          mcp_server:
            (sa as any)?.mcp_server ||
            process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
            "",
        }));

        // Ensure top-level tools config includes MCP server URL
        const existingToolsConfig =
          (agent.config?.configurable?.tools as any) || {};
        const ensuredToolsConfig = {
          ...existingToolsConfig,
          url:
            existingToolsConfig.url ||
            process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
            "",
        };

        // Save the main agent with updated sub-agents
        await client.assistants.update(agent.assistant_id, {
          config: {
            configurable: {
              ...agent.config?.configurable,
              subagents: updatedSubAgents,
              tools: ensuredToolsConfig,
            },
          },
        });
      } else {
        // Update the main agent
        const { subAgents: currentSubAgents } = subAgentsForm.getValues();
        const sanitizedSubAgents = ((currentSubAgents as SubAgent[]) || []).map(
          (sa) => ({
            ...sa,
            mcp_server:
              (sa as any)?.mcp_server ||
              process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
              "",
          }),
        );

        // Ensure tools config includes MCP server URL and default auth flag
        const existingToolsConfig =
          (agent.config?.configurable?.tools as any) || {};
        const ensuredToolsConfig = {
          ...existingToolsConfig,
          url:
            existingToolsConfig.url ||
            process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
            "",
          auth_required:
            existingToolsConfig.auth_required !== undefined
              ? existingToolsConfig.auth_required
              : process.env.NEXT_PUBLIC_SUPABASE_AUTH_MCP === "true",
        };

        await client.assistants.update(agent.assistant_id, {
          name: editedTitle,
          config: {
            configurable: {
              ...agent.config?.configurable,
              instructions: instructionsMarkdown,
              tools: {
                ...ensuredToolsConfig,
                tools: currentTools,
                interrupt_config: currentInterruptConfig,
              },
              subagents: sanitizedSubAgents,
            },
          },
        });
      }

      toast.success("Configuration saved successfully");

      // Update local state to reflect saved changes
      setEditedTools(currentTools);
      setEditedInterruptConfig(currentInterruptConfig || {});
      setIsInstructionsDirty(false);
      setInitialTitle(editedTitle);

      // Reset form dirtiness so Save button hides after save
      toolsForm.reset(toolsForm.getValues());
      triggersForm.reset(triggersForm.getValues());
      subAgentsForm.reset(subAgentsForm.getValues());

      // Refresh agents data to show updated information
      if (onAgentUpdated) {
        await onAgentUpdated();
      }
    } catch (error) {
      console.error("Error saving agent configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No agent selected</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Title section */}
      <div className="flex-shrink-0 px-6 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isEditingSubAgent ? "Sub-agent" : "Main Agent"}
          </div>
          <div className="flex-1">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
              placeholder={
                isEditingSubAgent ? "Sub-agent name..." : "Agent name..."
              }
            />
          </div>
        </div>
      </div>

      {/* Header with view toggle buttons */}
      <div className="flex flex-shrink-0 flex-row items-center justify-between border-b border-gray-200 px-6 py-2">
        {!hideTopTabs && (
          <div className="flex items-center gap-2">
            {availableViews.includes("triggers") && (
              <Button
                variant={currentView === "triggers" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("triggers")}
                className={cn(
                  "h-8 gap-1",
                  currentView === "triggers" &&
                    "bg-[#2F6868] hover:bg-[#2F6868]/90",
                )}
                title="Triggers start the flow"
              >
                <Zap className="h-3 w-3" />
                Triggers
              </Button>
            )}
            {/* Visual flow from Triggers to Instructions */}
            {availableViews.includes("triggers") &&
              availableViews.includes("instructions") && (
                <span className="text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            {availableViews.includes("instructions") && (
              <Button
                variant={currentView === "instructions" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("instructions")}
                className={cn(
                  "h-8 gap-1",
                  currentView === "instructions" &&
                    "bg-[#2F6868] hover:bg-[#2F6868]/90",
                )}
                title="Instructions guide the agent"
              >
                <FileText className="h-3 w-3" />
                Instructions
              </Button>
            )}
            {availableViews.includes("tools") && (
              <Button
                variant={currentView === "tools" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("tools")}
                className={cn(
                  "h-8 gap-1",
                  currentView === "tools" &&
                    "bg-[#2F6868] hover:bg-[#2F6868]/90",
                )}
                title="Tools are invoked during runs"
              >
                <Wrench className="h-3 w-3" />
                Tools
              </Button>
            )}
            {availableViews.includes("subagents") && (
              <Button
                variant={currentView === "subagents" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView("subagents")}
                className={cn(
                  "h-8 gap-1",
                  currentView === "subagents" &&
                    "bg-[#2F6868] hover:bg-[#2F6868]/90",
                )}
              >
                <Users className="h-3 w-3" />
                Sub-agents
              </Button>
            )}
          </div>
        )}
        {/* Tools indicator: icon + list of selected tools */}
        <div className="mr-2 ml-6 hidden flex-1 items-center overflow-hidden border-l border-gray-200 pl-4 md:flex">
          {(() => {
            const toolNames = toolsForm.watch("tools") || [];
            const tooltip =
              toolNames.length > 0
                ? `Selected tools (${toolNames.length}): ${toolNames.join(", ")}`
                : "No tools selected";
            return (
              <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                <span title={tooltip} className="flex-shrink-0">
                  <Wrench
                    className="h-4 w-4 text-gray-500"
                    aria-label={tooltip}
                  />
                </span>
                {toolNames.length === 0 ? (
                  <span className="px-1 text-xs whitespace-nowrap text-gray-400">
                    None
                  </span>
                ) : (
                  toolNames.map((t) => (
                    <Badge
                      key={`summary-tool-${t}`}
                      variant="outline"
                      className="border-gray-300 whitespace-nowrap text-gray-700"
                    >
                      {t}
                    </Badge>
                  ))
                )}
              </div>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          {currentView === "instructions" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Save Changes Button */}
          {(() => {
            const isTitleDirty = editedTitle.trim() !== initialTitle.trim();
            const hasFormDirty =
              toolsForm.formState.isDirty ||
              triggersForm.formState.isDirty ||
              subAgentsForm.formState.isDirty;
            const hasChanges =
              isTitleDirty || isInstructionsDirty || hasFormDirty;
            return hasChanges ? (
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving || !agent}
                className="ml-2 bg-[#2F6868] text-white hover:bg-[#2F6868]/90 disabled:bg-gray-400"
                size="sm"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            ) : null;
          })()}
        </div>
      </div>

      {/* Content based on current view */}
      <div className="flex-1 overflow-auto">
        {currentView === "instructions" && (
          <div className="h-full bg-white">
            <div className="p-6">
              <div
                key={editorKey}
                onKeyDown={(e) => {
                  // Prevent keyboard shortcuts from bubbling up to parent components
                  if (e.ctrlKey || e.metaKey) {
                    e.stopPropagation();
                  }
                }}
              >
                <BlockNoteView
                  editor={editor}
                  onChange={() => setIsInstructionsDirty(true)}
                  className={cn("oap-blocknote min-h-full")}
                  theme="light"
                  data-color-scheme="light"
                />
              </div>
            </div>
          </div>
        )}

        {currentView === "tools" && (
          <div className="p-6">
            <CreateAgentToolsSelection
              selectedTools={toolsForm.watch("tools") || []}
              onToolsChange={(tools) =>
                toolsForm.setValue("tools", tools, { shouldDirty: true })
              }
              interruptConfig={toolsForm.watch("interruptConfig") || {}}
              onInterruptConfigChange={(config) =>
                toolsForm.setValue("interruptConfig", config, {
                  shouldDirty: true,
                })
              }
            />
          </div>
        )}

        {currentView === "triggers" && (
          <div className="p-6">
            <TriggersInterface
              groupedTriggers={groupedTriggers}
              loading={triggersLoading}
              showTriggersTab={showTriggersTab}
              form={triggersForm}
              hideHeader={true}
              reloadTriggers={reloadTriggers}
            />
          </div>
        )}

        {currentView === "subagents" && (
          <div className="p-6">
            <SubAgentCreator
              subAgents={subAgentsForm.watch("subAgents") ?? []}
              onSubAgentChange={(updatedSubAgents) =>
                subAgentsForm.setValue("subAgents", updatedSubAgents, {
                  shouldDirty: true,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
