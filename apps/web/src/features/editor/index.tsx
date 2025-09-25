"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { useQueryState } from "nuqs";
import { EditTarget } from "@/components/AgentHierarchyNav";
import { AgentConfig } from "@/components/AgentConfig";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubAgent } from "@/types/sub-agent";
import { InitialInputs } from "./components/initial-inputs";
import { useAgentToolsForm } from "@/components/agent-creator-sheet/components/agent-tools-form";
import type { ToolInterruptConfig } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import { useAgentTriggersForm } from "@/components/agent-creator-sheet/components/agent-triggers-form";
import { useTriggers } from "@/hooks/use-triggers";
import { groupTriggerRegistrationsByProvider } from "@/lib/triggers";
import type {
  GroupedTriggerRegistrationsByProvider,
  ListTriggerRegistrationsData,
  Trigger,
} from "@/types/triggers";
import { useFlags } from "launchdarkly-react-client-sdk";
import type { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { MainAgentToolsDropdown } from "./components/main-agent-tools-dropdown";
import {
  SelectedTriggersStrip,
  TriggersAddPopoverContent,
} from "./components/triggers-ui";
import { ToolsAddPopoverContent } from "./components/tools-add-popover-content";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DeepAgentChatBreadcrumb } from "@/features/chat/components/breadcrumb";
import { getDeployments } from "@/lib/environment/deployments";
import { SubAgentSheet } from "./components/subagent-sheet";
import { SubagentsList } from "./components/subagents-list";

export function EditorPageContent(): React.ReactNode {
  const router = useRouter();
  const { session } = useAuthContext();
  const { agents, refreshAgents } = useAgentsContext();
  const deployments = getDeployments();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [_threadId, setThreadId] = useQueryState("threadId");

  // State for hierarchical editing
  const [currentEditTarget, setCurrentEditTarget] = useState<EditTarget | null>(
    null,
  );

  const toolsForm = useAgentToolsForm();
  const triggersForm = useAgentTriggersForm();
  const [toolsDrafts, setToolsDrafts] = useState<
    Record<string, { tools: string[]; interruptConfig: ToolInterruptConfig }>
  >({});
  const isApplyingToolsResetRef = React.useRef(false);
  // Triggers API access/data
  const { listTriggers, listUserTriggers, listAgentTriggers } = useTriggers();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();
  const [triggers, setTriggers] = useState<Trigger[] | undefined>();
  const [registrations, setRegistrations] = useState<
    ListTriggerRegistrationsData[] | undefined
  >();
  const groupedTriggers: GroupedTriggerRegistrationsByProvider | undefined =
    React.useMemo(() => {
      if (!registrations || !triggers) return undefined;
      return groupTriggerRegistrationsByProvider(registrations, triggers);
    }, [registrations, triggers]);

  // UI: popover states handled by Popover components
  const [subAgentSheetOpen, setSubAgentSheetOpen] = useState(false);
  const [editingSubAgent, setEditingSubAgent] = useState<{
    subAgent: SubAgent;
    index: number;
  } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatVersion, setChatVersion] = useState(0);
  const [headerTitle, setHeaderTitle] = useState<string>("");
  const saveRef = React.useRef<(() => Promise<void>) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Keep latest trigger functions in a ref so effect deps don't churn
  const triggerFnsRef = React.useRef({
    listTriggers,
    listUserTriggers,
    listAgentTriggers,
  });
  React.useEffect(() => {
    triggerFnsRef.current = {
      listTriggers,
      listUserTriggers,
      listAgentTriggers,
    };
  }, [listTriggers, listUserTriggers, listAgentTriggers]);
  // Prevent duplicate loads for the same agent/token combo (helps in dev Strict Mode)
  const loadedKeyRef = React.useRef<string | null>(null);
  const setTriggerIds = React.useCallback(
    (ids: string[]) => {
      triggersForm.setValue("triggerIds", ids);
    },
    [triggersForm],
  );

  const handleAgentUpdated = React.useCallback(async () => {
    await refreshAgents();
    // Clear threadId so subsequent messages start a fresh thread with new config
    await setThreadId(null);
    setChatVersion((v) => v + 1);
    toast.success("Agent saved. New chat started with latest config.");
  }, [refreshAgents, setThreadId]);

  const selectedAgent = useMemo(() => {
    return agents.find(
      (agent) =>
        agent.assistant_id === agentId && agent.deploymentId === deploymentId,
    );
  }, [agents, agentId, deploymentId]);

  const selectedDeployment = useMemo(
    () => deployments.find((d) => d.id === deploymentId),
    [deploymentId, deployments],
  );

  useEffect(() => {
    if (selectedAgent?.name) {
      setHeaderTitle(selectedAgent.name);
    }
  }, [selectedAgent?.assistant_id, selectedAgent?.name]);

  // Initialize edit target when agent is selected (used for subagents list selection)
  useEffect(() => {
    if (selectedAgent && !currentEditTarget) {
      setCurrentEditTarget({ type: "main", agent: selectedAgent });
    }
  }, [selectedAgent, currentEditTarget]);

  // Tools should always reflect the main agent, never subagent
  const currentTargetKey = "main";

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
          return prev;
        }
        return { ...prev, [currentTargetKey]: draft };
      });
    });
    return () => subscription.unsubscribe();
  }, [toolsForm, currentTargetKey]);

  useEffect(() => {
    const savedTools =
      (selectedAgent?.config?.configurable as any)?.tools?.tools || [];
    const savedInterruptConfig =
      (selectedAgent?.config?.configurable as any)?.tools?.interrupt_config ||
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
  }, [
    selectedAgent?.assistant_id,
    selectedAgent?.config?.configurable,
    toolsDrafts,
    toolsForm,
  ]);

  // Load triggers lists and currently selected triggers for main agent
  useEffect(() => {
    if (!session?.accessToken || !selectedAgent?.assistant_id) return;
    const key = `${session.accessToken}:${selectedAgent.assistant_id}:${String(
      showTriggersTab,
    )}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;

    let cancelled = false;
    (async () => {
      try {
        const { listTriggers, listUserTriggers, listAgentTriggers } =
          triggerFnsRef.current;
        const [t, r] = await Promise.all([
          listTriggers(session.accessToken),
          listUserTriggers(session.accessToken),
        ]);
        if (cancelled) return;
        setTriggers(t);
        setRegistrations(r);
        const ids = await listAgentTriggers(
          session.accessToken,
          selectedAgent.assistant_id,
        );
        if (cancelled) return;
        setTriggerIds(ids);
      } finally {
        // noop
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    session?.accessToken,
    selectedAgent?.assistant_id,
    showTriggersTab,
    setTriggerIds,
  ]);

  // No chat panel in the new layout; thread reset happens on save where relevant

  if (!session) {
    return <div>Loading...</div>;
  }

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <InitialInputs
        onAgentCreated={async (agentId: string, deploymentId: string) => {
          await setAgentId(agentId);
          await setDeploymentId(deploymentId);
        }}
      />
    );
  }

  // no-op

  return (
    <div className="flex h-screen flex-col gap-4 bg-gray-50 p-4">
      {/* Page header with title/description and actions */}
      {selectedAgent && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <input
              value={headerTitle}
              onChange={(e) => setHeaderTitle(e.target.value)}
              placeholder="Agent name..."
              className="w-full truncate border-none bg-transparent text-[28px] leading-snug font-bold text-gray-900 outline-none focus:outline-none"
            />
            <div className="mt-0.5 truncate text-sm text-gray-600">
              {(selectedAgent.metadata as any)?.description || ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!agentId || !deploymentId) return;
                const search = new URLSearchParams({
                  agentId,
                  deploymentId,
                }).toString();
                router.push(`/agents/chat?${search}`);
              }}
              className="rounded-md bg-[#2F6868] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#2F6868]/90"
            >
              Use agent
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!saveRef.current || isSaving) return;
                try {
                  setIsSaving(true);
                  await saveRef.current();
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-md border border-gray-300 bg-gray-300 px-3 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-300"
                  >
                    Train
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Use an optimizer to automatically make improvements to your
                    agent.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      {/* Top process sections */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Triggers (Main Agent) */}
        {showTriggersTab !== false && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
              <div className="text-sm font-semibold text-gray-700">
                Triggers
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <TooltipIconButton
                    size="sm"
                    variant="ghost"
                    aria-label="Add trigger"
                    tooltip="Add trigger"
                    className="ml-auto h-7 w-7 text-gray-600 hover:bg-gray-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </TooltipIconButton>
                </PopoverTrigger>
                <PopoverAnchor className="block h-0 w-0" />
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="max-w-[95vw] min-w-[600px] p-0"
                >
                  <TriggersAddPopoverContent
                    groupedTriggers={groupedTriggers}
                    form={triggersForm}
                    reloadTriggers={async () => {
                      if (!session?.accessToken || !selectedAgent) return;
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
                      } catch (error) {
                        console.error("Failed to reload triggers:", error);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="p-3">
              <SelectedTriggersStrip
                groupedTriggers={groupedTriggers}
                form={triggersForm}
              />
            </div>
          </div>
        )}

        {/* Tools (Current target; default main) */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <div className="text-sm font-semibold text-gray-700">Tools</div>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipIconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Add tool"
                  tooltip="Add tool"
                  className="ml-auto h-7 w-7 text-gray-600 hover:bg-gray-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                </TooltipIconButton>
              </PopoverTrigger>
              <PopoverAnchor className="block h-0 w-0" />
              <PopoverContent
                align="start"
                sideOffset={6}
                className="max-w-[95vw] min-w-[600px] p-0"
              >
                <ToolsAddPopoverContent toolsForm={toolsForm} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="p-3">
            <MainAgentToolsDropdown
              toolsForm={toolsForm}
              hideHeader
              hideTitle
            />
          </div>
        </div>

        {/* Subagents (list with tools) */}
        {selectedAgent && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
              <div className="text-sm font-semibold text-gray-700">
                Subagents
              </div>
              <TooltipIconButton
                size="sm"
                variant="ghost"
                aria-label="Add sub-agent"
                tooltip="Add sub-agent"
                className="h-7 w-7 text-gray-600 hover:bg-gray-100"
                onClick={() => {
                  setEditingSubAgent(null);
                  setSubAgentSheetOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </TooltipIconButton>
            </div>
            <div className="max-h-[32rem] overflow-auto p-3">
              <SubagentsList
                subAgents={
                  (selectedAgent.config?.configurable
                    ?.subagents as SubAgent[]) || []
                }
                selectedIndex={
                  currentEditTarget?.type === "subagent"
                    ? currentEditTarget.index
                    : null
                }
                onSelect={(index) => {
                  const subAgents =
                    (selectedAgent.config?.configurable
                      ?.subagents as SubAgent[]) || [];
                  const sa = subAgents[index];
                  if (!sa) return;
                  setCurrentEditTarget({
                    type: "subagent",
                    subAgent: sa,
                    index,
                  });
                  setEditingSubAgent({ subAgent: sa, index });
                  setSubAgentSheetOpen(true);
                }}
              />
            </div>
            <SubAgentSheet
              open={subAgentSheetOpen}
              onOpenChange={(open) => {
                setSubAgentSheetOpen(open);
                if (!open) setEditingSubAgent(null);
              }}
              editingSubAgent={editingSubAgent}
              onSubmit={(newSubAgent) => {
                if (!selectedAgent) return;
                const currentSubAgents =
                  (selectedAgent.config?.configurable
                    ?.subagents as SubAgent[]) || [];
                let updatedSubAgents: SubAgent[];
                let targetIndex: number;
                if (editingSubAgent) {
                  // Update existing subagent
                  updatedSubAgents = currentSubAgents.map((sa, idx) =>
                    idx === editingSubAgent.index ? newSubAgent : sa,
                  );
                  targetIndex = editingSubAgent.index;
                } else {
                  // Create new subagent
                  updatedSubAgents = [...currentSubAgents, newSubAgent];
                  targetIndex = updatedSubAgents.length - 1;
                }
                if (selectedAgent.config?.configurable) {
                  selectedAgent.config.configurable.subagents =
                    updatedSubAgents;
                }
                setCurrentEditTarget({
                  type: "subagent",
                  subAgent: newSubAgent,
                  index: targetIndex,
                });
                setEditingSubAgent(null);
                toast.success(
                  `${editingSubAgent ? "Updated" : "Created"} ${newSubAgent.name} - ready to edit!`,
                );
              }}
              onDelete={(index) => {
                if (!selectedAgent) return;
                const currentSubAgents =
                  (selectedAgent.config?.configurable
                    ?.subagents as SubAgent[]) || [];
                const deletedSubAgent = currentSubAgents[index];
                const updatedSubAgents = currentSubAgents.filter(
                  (_, idx) => idx !== index,
                );

                if (selectedAgent.config?.configurable) {
                  selectedAgent.config.configurable.subagents =
                    updatedSubAgents;
                }

                // Reset edit target to main if we were editing the deleted subagent
                if (
                  currentEditTarget?.type === "subagent" &&
                  currentEditTarget.index === index
                ) {
                  setCurrentEditTarget({ type: "main", agent: selectedAgent });
                } else if (
                  currentEditTarget?.type === "subagent" &&
                  currentEditTarget.index > index
                ) {
                  // Adjust index if we were editing a subagent after the deleted one
                  setCurrentEditTarget({
                    ...currentEditTarget,
                    index: currentEditTarget.index - 1,
                  });
                }

                setEditingSubAgent(null);
                toast.success(`Deleted ${deletedSubAgent?.name || "subagent"}`);
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom: Always-visible Instructions editor for main agent */}
      {selectedAgent && (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-t-0 border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
            Instructions
          </div>
          <div className="h-full overflow-auto">
            <AgentConfig
              agent={selectedAgent}
              editTarget={{ type: "main", agent: selectedAgent }}
              onAgentUpdated={handleAgentUpdated}
              hideTopTabs={true}
              hideTitleSection={true}
              externalTitle={headerTitle}
              onExternalTitleChange={setHeaderTitle}
              saveRef={saveRef}
              toolsFormExternal={toolsForm}
              triggersFormExternal={triggersForm}
              view={"instructions"}
              forceMainInstructionsView
            />
          </div>
        </div>
      )}

      {/* Slide-out chat on the right to test the agent */}
      <Sheet
        open={chatOpen}
        onOpenChange={setChatOpen}
      >
        <SheetContent
          side="right"
          className="w-[min(90vw,520px)] p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b px-4 py-2">
            <SheetTitle className="text-sm font-semibold">Use agent</SheetTitle>
          </SheetHeader>
          {agentId && deploymentId && session?.accessToken ? (
            <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-1 flex-col">
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
          ) : (
            <div className="p-4 text-sm text-gray-500">
              Select an agent to test
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
