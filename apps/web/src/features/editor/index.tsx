"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { getDeployments } from "@/lib/environment/deployments";
import { useQueryState } from "nuqs";
import { AgentConfig } from "@/components/AgentConfig";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DeepAgentChatBreadcrumb } from "@/features/chat/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
import { toast } from "sonner";
import { AgentHierarchyNav, EditTarget } from "@/components/AgentHierarchyNav";
import { SubAgent } from "@/types/sub-agent";
import { InitialInputs } from "./components/initial-inputs";
import { useAgentToolsForm } from "@/components/agent-creator-sheet/components/agent-tools-form";
import type { ToolInterruptConfig } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import { useAgentTriggersForm } from "@/components/agent-creator-sheet/components/agent-triggers-form";
import { SidebarTriggers } from "@/features/editor/components/sidebar-triggers";
import { useTriggers } from "@/hooks/use-triggers";
import { groupTriggerRegistrationsByProvider } from "@/lib/triggers";
import type {
  GroupedTriggerRegistrationsByProvider,
  Trigger,
  ListTriggerRegistrationsData,
} from "@/types/triggers";
import { useFlags } from "launchdarkly-react-client-sdk";
import type { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";

export function EditorPageContent(): React.ReactNode {
  const { session } = useAuthContext();
  const { agents, refreshAgents } = useAgentsContext();
  const deployments = getDeployments();

  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [_threadId, setThreadId] = useQueryState("threadId");
  const [newAgent, setNewAgent] = useQueryState("new");

  // State for hierarchical editing
  const [currentEditTarget, setCurrentEditTarget] = useState<EditTarget | null>(
    null,
  );

  // Force re-render when sub-agents change
  const [subAgentsVersion, setSubAgentsVersion] = useState(0);
  const [chatVersion, setChatVersion] = useState(0);
  // External forms for tools/triggers for shared state
  const toolsForm = useAgentToolsForm();
  const triggersForm = useAgentTriggersForm();
  const [toolsDrafts, setToolsDrafts] = useState<
    Record<string, { tools: string[]; interruptConfig: ToolInterruptConfig }>
  >({});
  const isApplyingToolsResetRef = React.useRef(false);
  // Triggers data for sidebar
  const { listTriggers, listUserTriggers, listAgentTriggers } = useTriggers();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();
  const [triggersLoading, setTriggersLoading] = useState(false);
  const [triggers, setTriggers] = useState<Trigger[] | undefined>();
  const [registrations, setRegistrations] = useState<
    ListTriggerRegistrationsData[] | undefined
  >();
  const groupedTriggers: GroupedTriggerRegistrationsByProvider | undefined =
    React.useMemo(() => {
      if (!registrations || !triggers) return undefined;
      return groupTriggerRegistrationsByProvider(registrations, triggers);
    }, [registrations, triggers]);

  // Auto-select first agent if none selected and we have agents
  useEffect(() => {
    if (!agentId && !newAgent && agents.length > 0) {
      const firstAgent = agents[0];
      setAgentId(firstAgent.assistant_id);
      setDeploymentId(firstAgent.deploymentId);
    }
  }, [agentId, newAgent, agents, setAgentId, setDeploymentId]);

  const handleAgentUpdated = React.useCallback(async () => {
    await refreshAgents();
    // Clear threadId so subsequent messages start a fresh thread with new config
    await setThreadId(null);
    setChatVersion((v) => v + 1);
    toast.success("Agent saved. New chat started with latest config.");
  }, [refreshAgents, setThreadId]);

  const selectedDeployment = useMemo(
    () => deployments.find((d) => d.id === deploymentId),
    [deploymentId],
  );

  const selectedAgent = useMemo(() => {
    return agents.find(
      (agent) =>
        agent.assistant_id === agentId && agent.deploymentId === deploymentId,
    );
  }, [agents, agentId, deploymentId]);

  // Initialize edit target when agent is selected
  useEffect(() => {
    if (selectedAgent && !currentEditTarget) {
      setCurrentEditTarget({ type: "main", agent: selectedAgent });
    }
  }, [selectedAgent, currentEditTarget]);

  // Utility to compute a stable key for the current edit target
  const currentTargetKey = React.useMemo(() => {
    if (!currentEditTarget) return "main";
    return currentEditTarget.type === "subagent"
      ? `sub:${currentEditTarget.index}`
      : "main";
  }, [currentEditTarget]);

  // Persist draft tool changes per-target so switching targets doesn't lose draft edits
  useEffect(() => {
    const subscription = toolsForm.watch((value) => {
      if (isApplyingToolsResetRef.current) return;
      const draft = {
        tools: (value.tools as string[]) || [],
        interruptConfig: (value.interruptConfig as ToolInterruptConfig) || {},
      };
      setToolsDrafts((prev) => {
        const prevDraft = prev[currentTargetKey];
        if (
          prevDraft &&
          Array.isArray(prevDraft.tools) &&
          prevDraft.tools.length === (draft.tools || []).length &&
          prevDraft.tools.every((t, i) => t === draft.tools[i]) &&
          JSON.stringify(prevDraft.interruptConfig || {}) ===
            JSON.stringify(draft.interruptConfig || {})
        ) {
          return prev; // no change
        }
        return { ...prev, [currentTargetKey]: draft };
      });
    });
    return () => subscription.unsubscribe();
  }, [toolsForm, currentTargetKey]);

  // Keep tools form values in sync when switching edit targets, prefer draft if present
  useEffect(() => {
    const isSub = currentEditTarget?.type === "subagent";
    const currentSubAgents =
      (selectedAgent?.config?.configurable?.subagents as SubAgent[]) || [];
    const sub =
      isSub && typeof currentEditTarget?.index === "number"
        ? currentSubAgents[currentEditTarget.index]
        : null;
    const savedTools = isSub
      ? sub?.tools || []
      : (selectedAgent?.config?.configurable as any)?.tools?.tools || [];
    const savedInterruptConfig = isSub
      ? (sub as any)?.interrupt_config || {}
      : (selectedAgent?.config?.configurable as any)?.tools?.interrupt_config ||
        {};

    const draft = toolsDrafts[currentTargetKey];
    isApplyingToolsResetRef.current = true;
    toolsForm.reset(
      {
        tools: draft?.tools ?? savedTools,
        interruptConfig: draft?.interruptConfig ?? savedInterruptConfig,
      },
      { keepDirty: false },
    );
    // release on next tick to avoid capturing reset changes
    setTimeout(() => {
      isApplyingToolsResetRef.current = false;
    }, 0);
  }, [selectedAgent?.assistant_id, currentTargetKey]);

  // Load triggers for sidebar; only for main agent
  useEffect(() => {
    const load = async () => {
      if (showTriggersTab === false || showTriggersTab === undefined) {
        setTriggersLoading(false);
        return;
      }
      if (!session?.accessToken || !selectedAgent) return;
      setTriggersLoading(true);
      try {
        const [t, r] = await Promise.all([
          listTriggers(session.accessToken),
          listUserTriggers(session.accessToken),
        ]);
        setTriggers(t);
        setRegistrations(r);
        const ids = await listAgentTriggers(
          session.accessToken,
          selectedAgent.assistant_id,
        );
        triggersForm.setValue("triggerIds", ids);
      } finally {
        setTriggersLoading(false);
      }
    };
    load();
  }, [session?.accessToken, selectedAgent?.assistant_id, showTriggersTab]);

  const handleCreateSubAgent = () => {
    if (!selectedAgent) return;

    // Create a blank sub-agent
    const newSubAgent: SubAgent = {
      name: `Sub-agent ${((selectedAgent.config?.configurable?.subagents as SubAgent[])?.length || 0) + 1}`,
      description: "",
      prompt: "",
      tools: [],
      mcp_server: process.env.NEXT_PUBLIC_MCP_SERVER_URL || "",
    };

    // Add to the main agent's sub-agents list
    const currentSubAgents =
      (selectedAgent.config?.configurable?.subagents as SubAgent[]) || [];
    const updatedSubAgents = [...currentSubAgents, newSubAgent];

    // Update the agent's config (this will be saved when they hit save)
    if (selectedAgent.config?.configurable) {
      selectedAgent.config.configurable.subagents = updatedSubAgents;
    }

    // Force a re-render to update the hierarchy navigation
    setSubAgentsVersion((prev) => prev + 1);

    // Immediately switch to editing the new sub-agent
    const newIndex = updatedSubAgents.length - 1;
    setCurrentEditTarget({
      type: "subagent",
      subAgent: newSubAgent,
      index: newIndex,
    });

    toast.success(`Created ${newSubAgent.name} - ready to edit!`);
  };

  const handleDeleteSubAgent = (index: number) => {
    if (!selectedAgent) return;

    const currentSubAgents =
      (selectedAgent.config?.configurable?.subagents as SubAgent[]) || [];
    if (index < 0 || index >= currentSubAgents.length) return;

    const updatedSubAgents = currentSubAgents.filter((_, i) => i !== index);

    if (selectedAgent.config?.configurable) {
      selectedAgent.config.configurable.subagents = updatedSubAgents;
    }

    // Update current edit target if needed
    if (currentEditTarget?.type === "subagent") {
      if (updatedSubAgents.length === 0) {
        setCurrentEditTarget({ type: "main", agent: selectedAgent });
      } else {
        const newIndex = Math.min(index, updatedSubAgents.length - 1);
        setCurrentEditTarget({
          type: "subagent",
          subAgent: updatedSubAgents[newIndex],
          index: newIndex,
        });
      }
    }

    setSubAgentsVersion((prev) => prev + 1);
    toast.success("Sub-agent removed. Click Save Changes to persist.");
  };

  const handleNewThread = async () => {
    // Clear threadId to start a fresh chat thread while keeping the agent selection
    await setThreadId(null);
    setChatVersion((v) => v + 1);
  };

  const handleAgentCreated = async (
    createdAgentId: string,
    createdDeploymentId: string,
  ) => {
    // Set the new agent as selected
    await setAgentId(createdAgentId);
    await setDeploymentId(createdDeploymentId);
    // Clear the "new" flag to show the editor
    await setNewAgent(null);
    // Reset chat and trigger refresh
    await setThreadId(null);
    setChatVersion((v) => v + 1);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  // Show new agent creation form if new=true parameter is present
  if (newAgent === "true") {
    return <InitialInputs onAgentCreated={handleAgentCreated} />;
  }

  if (!agentId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen gap-4 p-4">
      {/* Left column: Top half Triggers, bottom half Sub-agents hierarchy */}
      <div className="w-[24rem] flex-shrink-0">
        <div className="scrollbar-pretty-auto h-full overflow-auto pr-0">
          <SidebarTriggers
            groupedTriggers={groupedTriggers}
            loading={triggersLoading}
            showTriggersTab={showTriggersTab}
            form={triggersForm}
            hideHeader={false}
            targetLabel={
              selectedAgent ? `${selectedAgent.name} (Main)` : "Main Agent"
            }
            note={
              currentEditTarget?.type === "subagent"
                ? "Triggers are configured for the main agent"
                : undefined
            }
            reloadTriggers={async () => {
              if (!session?.accessToken || !selectedAgent) return;
              setTriggersLoading(true);
              try {
                const [t, r] = await Promise.all([
                  listTriggers(session.accessToken),
                  listUserTriggers(session.accessToken),
                ]);
                setTriggers(t);
                setRegistrations(r);
                const ids = await listAgentTriggers(
                  session.accessToken,
                  selectedAgent.assistant_id,
                );
                triggersForm.setValue("triggerIds", ids);
              } finally {
                setTriggersLoading(false);
              }
            }}
          />
          <div className="my-5 h-px w-full bg-gray-200" />
          <div className="flex cursor-default items-center gap-1 px-3 py-3 text-xs font-medium text-gray-500 uppercase">
            Hierarchy
          </div>
          {selectedAgent && currentEditTarget && (
            <AgentHierarchyNav
              key={subAgentsVersion}
              agent={selectedAgent}
              currentTarget={currentEditTarget}
              onTargetChange={setCurrentEditTarget}
              onCreateSubAgent={handleCreateSubAgent}
              onDeleteSubAgent={handleDeleteSubAgent}
              compact
              toolsForm={toolsForm}
            />
          )}
        </div>
      </div>

      {/* Middle column - Agent Configuration */}
      <div className="flex-1">
        <div className="border-border flex h-full min-h-0 flex-1 flex-col rounded-xl border bg-white">
          {currentEditTarget && (
            <AgentConfig
              agent={selectedAgent || null}
              editTarget={currentEditTarget}
              onAgentUpdated={handleAgentUpdated}
              hideTopTabs={false}
              hideTriggersTab={true}
              hideToolsTab={true}
              toolsFormExternal={toolsForm}
              triggersFormExternal={triggersForm}
            />
          )}
        </div>
      </div>

      {/* Right column - Chat with Agent */}
      <div className="flex min-h-0 w-1/4 flex-col">
        <div className="mb-0 flex items-center justify-between gap-2 px-6">
          <h2 className="text-base font-semibold text-gray-800 md:text-lg">
            Chat with your agent
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewThread}
            className="shadow-icon-button size-6 rounded border border-[#2F6868] bg-[#2F6868] p-2 text-white hover:bg-[#2F6868] hover:text-gray-50"
            title="Start new chat"
          >
            <SquarePen className="size-4" />
          </Button>
        </div>
        <div className="-mt-2 flex min-h-0 flex-1 flex-col pb-6">
          <DeepAgentChatInterface
            key={`chat-${agentId}-${deploymentId}-${chatVersion}`}
            assistantId={agentId}
            deploymentUrl={selectedDeployment?.deploymentUrl || ""}
            accessToken={session.accessToken || ""}
            optimizerDeploymentUrl={selectedDeployment?.deploymentUrl || ""}
            optimizerAccessToken={session.accessToken || ""}
            mode="oap"
            SidebarTrigger={SidebarTrigger}
            DeepAgentChatBreadcrumb={DeepAgentChatBreadcrumb}
            view="chat"
            hideInternalToggle={true}
            hideSidebar={true}
          />
        </div>
      </div>
    </div>
  );
}
