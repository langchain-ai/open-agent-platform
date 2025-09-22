"use client";

import React, { useState } from "react";
import { Agent } from "@/types/agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Save, Download, Settings, Zap, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import { CreateAgentToolsSelection } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import { useMCPContext } from "@/providers/MCP";
import { cn } from "@/lib/utils";
import TriggersInterface from "@/features/triggers";
import { useTriggers } from "@/hooks/use-triggers";
import { useAgentTriggersForm } from "@/components/agent-creator-sheet/components/agent-triggers-form";
import { useAgentToolsForm } from "@/components/agent-creator-sheet/components/agent-tools-form";
import { useMemo, useEffect } from "react";
import { groupTriggerRegistrationsByProvider } from "@/lib/triggers";
import { useFlags } from "launchdarkly-react-client-sdk";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { GroupedTriggerRegistrationsByProvider, ListTriggerRegistrationsData, Trigger } from "@/types/triggers";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import styles from "./AgentConfig.module.css";
import { SubAgentCreator } from "@/components/agent-creator-sheet/components/sub-agents";
import { SubAgent } from "@/types/sub-agent";
import { useForm as useReactHookForm } from "react-hook-form";
import { EditTarget } from "@/components/AgentHierarchyNav";

interface AgentConfigProps {
  agent: Agent | null;
  editTarget?: EditTarget;
  onAgentUpdated?: () => Promise<void>;
}

type ViewType = "instructions" | "tools" | "triggers" | "subagents";

export function AgentConfig({ agent, editTarget, onAgentUpdated }: AgentConfigProps) {
  const { session } = useAuthContext();
  const { tools: mcpTools } = useMCPContext();
  const {
    listTriggers,
    listUserTriggers,
    updateAgentTriggers,
    setupAgentTrigger,
    listAgentTriggers
  } = useTriggers();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();

  // Extract data based on edit target
  const isEditingSubAgent = editTarget?.type === "subagent";
  const currentSubAgent = isEditingSubAgent ? editTarget.subAgent : null;

  const currentTitle = isEditingSubAgent
    ? currentSubAgent?.name || "Untitled Sub-agent"
    : agent?.name || "Untitled Agent";

  const instructions = isEditingSubAgent
    ? currentSubAgent?.prompt || "No instructions provided"
    : agent?.config?.configurable?.instructions || "No instructions provided";

  const tools = isEditingSubAgent
    ? currentSubAgent?.tools || []
    : agent?.config?.configurable?.tools?.tools || [];

  const interruptConfig = isEditingSubAgent
    ? {} // Sub-agents don't have interrupt config
    : agent?.config?.configurable?.tools?.interrupt_config || {};

  const subAgents = agent?.config?.configurable?.subagents || [];

  // Show different tabs based on what we're editing
  const availableViews: ViewType[] = isEditingSubAgent
    ? ["instructions", "tools"] // Sub-agents only have instructions and tools
    : ["instructions", "tools", "triggers"]; // Main agents have instructions, tools, and triggers (sub-agents managed via hierarchy)

  const [currentView, setCurrentView] = useState<ViewType>("instructions");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedInstructions, setEditedInstructions] = useState("");
  const [editedTools, setEditedTools] = useState<string[]>([]);
  const [editedInterruptConfig, setEditedInterruptConfig] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Create tools form to track changes
  const toolsForm = useAgentToolsForm({
    tools: editedTools,
    interruptConfig: editedInterruptConfig,
  });

  // Create sub-agents form to track changes
  const subAgentsForm = useReactHookForm<{ subAgents: SubAgent[] }>({
    defaultValues: {
      subAgents: subAgents,
    },
  });

  // Create BlockNote editor with a unique key for each edit target
  const editorKey = `${agent?.assistant_id}-${isEditingSubAgent ? `subagent-${editTarget?.type === "subagent" ? editTarget.index : 0}` : "main"}`;
  const editor = useCreateBlockNote({
    initialContent: undefined, // Will be set in useEffect
    onFocus: () => {
      // Prevent keyboard shortcuts from bubbling up when editor is focused
    },
  });

  // Triggers state
  const [triggers, setTriggers] = useState<Trigger[] | undefined>();
  const [registrations, setRegistrations] = useState<ListTriggerRegistrationsData[] | undefined>();
  const [triggersLoading, setTriggersLoading] = useState(true);

  const triggersForm = useAgentTriggersForm({
    triggerIds: [], // Will be loaded in useEffect
  });

  const groupedTriggers: GroupedTriggerRegistrationsByProvider | undefined = useMemo(() => {
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
    if (agent) {
      console.log("Agent object:", agent);
      console.log("Agent config:", agent.config);
      if (isEditingSubAgent) {
        console.log("Editing sub-agent:", currentSubAgent);
        console.log("Sub-agent prompt:", currentSubAgent?.prompt);
      } else {
        console.log("Instructions path:", agent.config?.configurable?.instructions);
      }
    }
    // Get fresh values each time we switch edit targets
    const freshTitle = isEditingSubAgent
      ? currentSubAgent?.name || "Untitled Sub-agent"
      : agent?.name || "Untitled Agent";
    const freshInstructions = isEditingSubAgent
      ? currentSubAgent?.prompt || "No instructions provided"
      : agent?.config?.configurable?.instructions || "No instructions provided";
    const freshTools = isEditingSubAgent
      ? currentSubAgent?.tools || []
      : agent?.config?.configurable?.tools?.tools || [];
    const freshInterruptConfig = isEditingSubAgent
      ? {} // Sub-agents don't have interrupt config
      : agent?.config?.configurable?.tools?.interrupt_config || {};

    setEditedTitle(freshTitle);
    setEditedInstructions(freshInstructions);
    setEditedTools([...freshTools]);
    setEditedInterruptConfig({...freshInterruptConfig});
  }, [agent?.assistant_id, editTarget?.type, editTarget?.type === "subagent" ? editTarget.index : null, agent?.config?.configurable?.subagents]);

  // Separate effect to update BlockNote editor content
  React.useEffect(() => {
    const updateEditorContent = async () => {
      const currentInstructions = isEditingSubAgent
        ? currentSubAgent?.prompt || "No instructions provided"
        : agent?.config?.configurable?.instructions || "No instructions provided";

      if (currentInstructions && currentInstructions !== "No instructions provided") {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(currentInstructions);
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
              children: []
            }
          ]);
        }
      } else {
        // Clear editor for empty instructions
        editor.replaceBlocks(editor.document, [
          {
            id: "default",
            type: "paragraph",
            props: {},
            content: "",
            children: []
          }
        ]);
      }
    };

    updateEditorContent();
  }, [agent?.assistant_id, editTarget?.type, editTarget?.type === "subagent" ? editTarget.index : null, editor]);

  // Separate effect to update forms when tools/interruptConfig/subAgents change
  React.useEffect(() => {
    toolsForm.setValue("tools", tools);
    toolsForm.setValue("interruptConfig", interruptConfig);
    subAgentsForm.setValue("subAgents", subAgents);
  }, [tools, interruptConfig, subAgents]);

  // Reset to instructions view when switching edit targets
  React.useEffect(() => {
    setCurrentView("instructions");
  }, [editTarget]);
  const [isRawView, setIsRawView] = useState(false);

  const handleCopy = async () => {
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      await navigator.clipboard.writeText(markdown);
      toast.success("Instructions copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy instructions");
    }
  };

  const handleSave = async () => {
    if (!agent) return;

    try {
      // TODO: Replace with actual API call to update agent config
      // Example API call structure:
      // await updateAgentConfig(agent.assistant_id, {
      //   configurable: {
      //     ...agent.config?.configurable,
      //     instructions: editedInstructions
      //   }
      // });

      console.log("Saving instructions for agent:", agent.assistant_id);
      console.log("New instructions:", editedInstructions);

      toast.success("Instructions saved successfully");
    } catch (error) {
      console.error("Error saving instructions:", error);
      toast.error("Failed to save instructions");
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
    } catch (error) {
      console.error("Error loading triggers:", error);
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
      const instructionsMarkdown = await editor.blocksToMarkdownLossy(editor.document);
      const { tools: currentTools, interruptConfig: currentInterruptConfig } = toolsForm.getValues();

      if (isEditingSubAgent && editTarget && currentSubAgent) {
        // Update the specific sub-agent
        const updatedSubAgent: SubAgent = {
          ...currentSubAgent,
          name: editedTitle,
          prompt: instructionsMarkdown,
          tools: currentTools,
        };

        // Update the sub-agents array in the main agent
        const currentSubAgents = agent?.config?.configurable?.subagents || [];
        const updatedSubAgents = currentSubAgents.map((sa, index) =>
          index === editTarget.index ? updatedSubAgent : sa
        );

        // Save the main agent with updated sub-agents
        await client.assistants.update(agent.assistant_id, {
          config: {
            configurable: {
              ...agent.config?.configurable,
              subagents: updatedSubAgents
            }
          }
        });

        console.log("Successfully updated sub-agent:", {
          agentId: agent.assistant_id,
          subAgentIndex: editTarget.index,
          subAgentName: updatedSubAgent.name,
          newInstructions: instructionsMarkdown,
          newTools: currentTools
        });
      } else {
        // Update the main agent
        const { subAgents: currentSubAgents } = subAgentsForm.getValues();

        await client.assistants.update(agent.assistant_id, {
          name: editedTitle,
          config: {
            configurable: {
              ...agent.config?.configurable,
              instructions: instructionsMarkdown,
              tools: {
                ...agent.config?.configurable?.tools,
                tools: currentTools,
                interrupt_config: currentInterruptConfig
              },
              subagents: currentSubAgents
            }
          }
        });

        console.log("Successfully updated main agent:", {
          agentId: agent.assistant_id,
          newInstructions: instructionsMarkdown,
          newTools: currentTools,
          newInterruptConfig: currentInterruptConfig,
          newSubAgents: currentSubAgents
        });
      }

      toast.success("Configuration saved successfully");

      // Update local state to reflect saved changes
      setEditedInstructions(instructionsMarkdown);
      setEditedTools(currentTools);
      setEditedInterruptConfig(currentInterruptConfig);

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

  const handleDownload = async () => {
    try {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      const blob = new Blob([markdown], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${agent?.name || "agent"}-instructions.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Instructions downloaded");
    } catch (error) {
      toast.error("Failed to download instructions");
    }
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No agent selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Title section */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isEditingSubAgent ? "Sub-agent" : "Main Agent"}
          </div>
          <div className="flex-1">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0"
              placeholder={isEditingSubAgent ? "Sub-agent name..." : "Agent name..."}
            />
          </div>
        </div>
      </div>

      {/* Header with view toggle buttons */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <div className="flex gap-2 items-center">
          {availableViews.includes("instructions") && (
            <Button
              variant={currentView === "instructions" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("instructions")}
              className={cn(
                "h-8",
                currentView === "instructions" && "bg-[#2F6868] hover:bg-[#2F6868]/90"
              )}
            >
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
                currentView === "tools" && "bg-[#2F6868] hover:bg-[#2F6868]/90"
              )}
            >
              <Settings className="h-3 w-3" />
              Tools
            </Button>
          )}
          {availableViews.includes("triggers") && (
            <Button
              variant={currentView === "triggers" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("triggers")}
              className={cn(
                "h-8 gap-1",
                currentView === "triggers" && "bg-[#2F6868] hover:bg-[#2F6868]/90"
              )}
            >
              <Zap className="h-3 w-3" />
              Triggers
            </Button>
          )}
          {availableViews.includes("subagents") && (
            <Button
              variant={currentView === "subagents" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("subagents")}
              className={cn(
                "h-8 gap-1",
                currentView === "subagents" && "bg-[#2F6868] hover:bg-[#2F6868]/90"
              )}
            >
              <Users className="h-3 w-3" />
              Sub-agents
            </Button>
          )}
        </div>
        <div className="flex gap-2 items-center">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRawView(!isRawView)}
                className="h-8 w-8 p-0"
              >
                {isRawView ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Save Changes Button */}
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || !agent}
            className="bg-[#2F6868] hover:bg-[#2F6868]/90 disabled:bg-gray-400 text-white ml-2"
            size="sm"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
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
                  className={cn("min-h-full", styles.blockNoteEditor)}
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
              onToolsChange={(tools) => toolsForm.setValue("tools", tools, { shouldDirty: true })}
              interruptConfig={toolsForm.watch("interruptConfig") || {}}
              onInterruptConfigChange={(config) => toolsForm.setValue("interruptConfig", config, { shouldDirty: true })}
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
                subAgentsForm.setValue("subAgents", updatedSubAgents, { shouldDirty: true })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}