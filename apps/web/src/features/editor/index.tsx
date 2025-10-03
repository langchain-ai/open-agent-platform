"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgentsContext } from "@/providers/Agents";
import { useAuthContext } from "@/providers/Auth";
import { useQueryState } from "nuqs";
import { EditTarget } from "@/components/AgentHierarchyNav";
import { AgentConfig } from "@/components/AgentConfig";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { Plus, Loader2, Braces, X, PenBoxIcon } from "lucide-react";
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
import { useLocalStorage } from "@/hooks/use-local-storage";
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
import { getDeployments, useDeployment } from "@/lib/environment/deployments";
import { SubAgentSheet } from "./components/subagent-sheet";
import { SubagentsList } from "./components/subagents-list";
import { BraceAgentState, BraceCard } from "./components/brace-card";
import { cn } from "@/lib/utils";
import { useMCPContext } from "@/providers/MCP";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClientProvider } from "../agent-chat/providers/ClientProvider";
import {
  ChatProvider,
  useChatContext,
} from "../agent-chat/providers/ChatProvider";
import { ChatInterface } from "../agent-chat/components/ChatInterface";
import { Agent } from "@/types/agent";
import { useStream } from "@langchain/langgraph-sdk/react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { formatUnknownError } from "@/lib/errors";

interface EditorPageContentProps {
  assistant: Agent | null;
}

function EditorPageContentComponent(
  props: EditorPageContentProps,
): React.ReactNode {
  const router = useRouter();
  const { session } = useAuthContext();
  const { agents, refreshAgents } = useAgentsContext();
  const { tools } = useMCPContext();
  const testChatContext = useChatContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [_newAgentEditor, setNewAgentEditor] = useQueryState("new");
  const [threadId, setThreadId] = useQueryState("threadId");

  const [deploymentId, setDeploymentId] = useDeployment();

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
  const [testMode, setTestMode] = useState(false);
  const [chatVersion, setChatVersion] = useState(0);
  const [headerTitle, setHeaderTitle] = useState<string>("");
  const saveRef = React.useRef<(() => Promise<void>) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [braceOpen, setBraceOpen] = useState(false);

  const client = useMemo(() => {
    if (!session?.accessToken || !deploymentId) return undefined;
    return createClient(deploymentId, session.accessToken);
  }, [deploymentId, session?.accessToken]);

  const braceAgentStream = useStream<BraceAgentState>({
    assistantId: "brace_agent",
    client: client,
    reconnectOnMount: true,
    defaultHeaders: { "x-auth-scheme": "langsmith" },
  });

  // Track first visit to editor page for glow effect
  const [hasVisitedEditor, setHasVisitedEditor] = useLocalStorage(
    "hasVisitedEditor",
    false,
  );
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

  const agentDescription = useMemo(() => {
    if (!selectedAgent) return null;
    const rawDescription = String(
      (selectedAgent.metadata as any)?.description || "",
    );
    if (rawDescription.length <= 75) {
      return {
        display: rawDescription,
        full: rawDescription,
        truncated: false,
      } as const;
    }
    return {
      display: `${rawDescription.slice(0, 75)}…`,
      full: rawDescription,
      truncated: true,
    } as const;
  }, [selectedAgent]);

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
          listTriggers(session.accessToken!),
          listUserTriggers(session.accessToken!),
        ]);
        if (cancelled) return;
        setTriggers(t);
        setRegistrations(r);
        const ids = await listAgentTriggers(
          session.accessToken!,
          selectedAgent.assistant_id,
        );
        if (cancelled) return;
        setTriggerIds(ids);

        // Fallback recheck: some backends update linkage asynchronously.
        // Re-fetch after a short delay and reconcile if different.
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const retryIds = await triggerFnsRef.current.listAgentTriggers(
              session.accessToken!,
              selectedAgent.assistant_id,
            );
            if (cancelled) return;
            const current = (triggersForm.getValues("triggerIds") ||
              []) as string[];
            const same =
              current.length === retryIds.length &&
              current.every((x, i) => x === retryIds[i]);
            if (!same) setTriggerIds(retryIds);
          } catch {
            // noop
          }
        }, 1200);
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
          await setNewAgentEditor(null);
        }}
      />
    );
  }

  // no-op

  return (
    <div className="relative flex h-screen flex-col gap-4 bg-gray-50 p-4">
      {/* Page header with title/description and actions */}
      {selectedAgent && (
        <div className="flex items-center justify-between px-1">
          <div className="min-w-0">
            <input
              value={headerTitle}
              onChange={(e) => setHeaderTitle(e.target.value)}
              placeholder="Agent name..."
              className="w-full truncate border-none bg-transparent text-[28px] leading-snug font-bold text-gray-900 outline-none focus:outline-none"
            />
            {agentDescription?.full &&
              (agentDescription.truncated ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-0.5 truncate text-sm text-gray-600">
                      {agentDescription.display}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{agentDescription.full}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="mt-0.5 truncate text-sm text-gray-600">
                  {agentDescription.display}
                </div>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-3 flex items-center gap-2 text-sm text-gray-700">
              <Switch
                id="editor-test-mode"
                checked={testMode}
                onCheckedChange={(value) => setTestMode(Boolean(value))}
                aria-label="Toggle test mode"
              />
              <label
                htmlFor="editor-test-mode"
                className="cursor-pointer"
              >
                Test Mode
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!agentId || !deploymentId) return;
                // Mark as visited when button is clicked
                setHasVisitedEditor(true);
                const search = new URLSearchParams({
                  agentId,
                  deploymentId,
                }).toString();
                router.push(`/agents/chat?${search}`);
              }}
              className={cn(
                "rounded-md bg-[#2F6868] px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#2F6868]/90",
                !hasVisitedEditor
                  ? "shadow-lg ring-2 shadow-[#2F6868]/50 ring-[#2F6868]/30 ring-offset-2"
                  : "",
              )}
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
          </div>
        </div>
      )}
      {/* Main content grid: left side (2 rows) + right side (full height) */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4">
        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          {testMode ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {agentId && deploymentId && session?.accessToken ? (
                  <div className="oap-deep-agent-chat flex h-full w-full gap-4 overflow-hidden">
                    <ChatInterface
                      assistant={props.assistant}
                      empty={false}
                      skeleton={false}
                      controls={
                        <Button
                          disabled={!threadId}
                          onClick={() => setThreadId(null)}
                        >
                          <PenBoxIcon className="size-3" />
                          New Thread
                        </Button>
                      }
                      testMode={testMode}
                      onTestFeedback={() => setBraceOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-sm text-gray-500">
                    Select an agent to test
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                {showTriggersTab !== false && (
                  <div className="flex h-48 min-w-[320px] flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
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
                              if (!session?.accessToken || !selectedAgent)
                                return;
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
                                console.error(
                                  "Failed to reload triggers:",
                                  error,
                                );
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto px-3 pt-3 pb-6">
                      <SelectedTriggersStrip
                        groupedTriggers={groupedTriggers}
                        form={triggersForm}
                      />
                    </div>
                  </div>
                )}

                <div className="flex h-48 min-w-[320px] flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                    <div className="text-sm font-semibold text-gray-700">
                      Tools
                    </div>
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
                  <div className="min-h-0 flex-1 overflow-auto px-3 pt-3 pb-6">
                    <MainAgentToolsDropdown
                      toolsForm={toolsForm}
                      hideHeader
                      hideTitle
                    />
                  </div>
                </div>

                {selectedAgent && (
                  <div className="flex h-48 min-w-[320px] flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
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
                    <div className="min-h-0 flex-1 overflow-auto px-3 pt-3 pb-6">
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
                          updatedSubAgents = currentSubAgents.map((sa, idx) =>
                            idx === editingSubAgent.index ? newSubAgent : sa,
                          );
                          targetIndex = editingSubAgent.index;
                        } else {
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

                        if (
                          currentEditTarget?.type === "subagent" &&
                          currentEditTarget.index === index
                        ) {
                          setCurrentEditTarget({
                            type: "main",
                            agent: selectedAgent,
                          });
                        } else if (
                          currentEditTarget?.type === "subagent" &&
                          currentEditTarget.index > index
                        ) {
                          setCurrentEditTarget({
                            ...currentEditTarget,
                            index: currentEditTarget.index - 1,
                          });
                        }

                        setEditingSubAgent(null);
                        toast.success(
                          `Deleted ${deletedSubAgent?.name || "subagent"}`,
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              {selectedAgent && (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="px-1 pb-2 text-sm font-semibold text-gray-700">
                    Instructions
                  </div>
                  <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="h-full min-w-0 overflow-y-auto">
                      <AgentConfig
                        key={`${selectedAgent.assistant_id}-${chatVersion}`}
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
        <Popover
          open={braceOpen}
          onOpenChange={setBraceOpen}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={braceOpen ? "Hide Brace Agent" : "Open Brace Agent"}
              aria-expanded={braceOpen}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full border border-purple-500 bg-purple-100/70 text-purple-700 shadow-lg backdrop-blur-sm transition-transform duration-200 hover:scale-105 hover:bg-purple-100/90 hover:text-purple-800 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:outline-none",
                braceOpen ? "ring-2 ring-purple-400" : "",
              )}
            >
              {braceOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Braces className="h-5 w-5" />
              )}
            </button>
          </PopoverTrigger>
          {selectedAgent && (
            <PopoverContent
              side="top"
              align="end"
              sideOffset={16}
              className="max-h-[80vh] w-[calc(100vw-3rem)] p-0 sm:w-[580px]"
            >
              <div className="h-[70vh] w-full">
                <BraceCard
                  onClose={() => setBraceOpen(false)}
                  assistant={selectedAgent}
                  tools={tools.map((t) => ({
                    name: t.name,
                    default_interrupt: !!t.default_interrupt,
                  }))}
                  triggers={triggers || []}
                  enabledTriggerIds={triggersForm.getValues("triggerIds") || []}
                  onAgentUpdated={async () => {
                    await refreshAgents();
                    setChatVersion((v) => v + 1);
                  }}
                  testThreadMessages={testChatContext.messages}
                  testThreadError={
                    testChatContext.error
                      ? formatUnknownError(testChatContext.error)
                      : undefined
                  }
                  stream={braceAgentStream}
                />
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>
    </div>
  );
}

export function EditorPageContent() {
  const { agents } = useAgentsContext();
  const { session } = useAuthContext();
  const deployments = getDeployments();
  const [deploymentId] = useDeployment();
  const [agentId] = useQueryState("agentId");

  const selectedDeployment = useMemo(
    () => deployments.find((d) => d.id === deploymentId),
    [deploymentId, deployments],
  );
  const deploymentUrl = selectedDeployment?.deploymentUrl ?? "";
  const accessToken = session?.accessToken || "";

  const selectedAssistant =
    agents.find((a) => a.assistant_id === agentId) ?? null;

  return (
    <ClientProvider
      deploymentUrl={deploymentUrl}
      accessToken={accessToken}
      optimizerUrl={deploymentUrl}
      optimizerAccessToken={accessToken}
    >
      <ChatProvider
        activeAssistant={selectedAssistant}
        testMode={true}
      >
        <EditorPageContentComponent assistant={selectedAssistant} />
      </ChatProvider>
    </ClientProvider>
  );
}
