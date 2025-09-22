"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AgentsProvider, useAgentsContext } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { useAuthContext } from "@/providers/Auth";
import { getDeployments } from "@/lib/environment/deployments";
import { useQueryState } from "nuqs";
import { AgentConfig } from "@/components/AgentConfig";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DeepAgentChatBreadcrumb } from "@/features/chat/components/breadcrumb";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { AgentHierarchyNav, EditTarget } from "@/components/AgentHierarchyNav";
import { SubAgent } from "@/types/sub-agent";

function EditorPageContent(): React.ReactNode {
  const { session } = useAuthContext();
  const { agents, loading, refreshAgents } = useAgentsContext();
  const deployments = getDeployments();

  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  // State for hierarchical editing
  const [currentEditTarget, setCurrentEditTarget] = useState<EditTarget | null>(null);

  // Force re-render when sub-agents change
  const [subAgentsVersion, setSubAgentsVersion] = useState(0);

  const handleValueChange = (v: string) => {
    setValue(v);
    setOpen(false);
  };

  const handleStartChat = () => {
    if (!value) {
      toast.info("Please select an agent");
      return;
    }
    const [agentId_, deploymentId_] = value.split(":");
    setAgentId(agentId_);
    setDeploymentId(deploymentId_);
  };

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

  const handleCreateSubAgent = () => {
    if (!selectedAgent) return;

    // Create a blank sub-agent
    const newSubAgent: SubAgent = {
      name: `Sub-agent ${(selectedAgent.config?.configurable?.subagents?.length || 0) + 1}`,
      description: "",
      prompt: "",
      tools: []
    };

    // Add to the main agent's sub-agents list
    const currentSubAgents = selectedAgent.config?.configurable?.subagents || [];
    const updatedSubAgents = [...currentSubAgents, newSubAgent];

    // Update the agent's config (this will be saved when they hit save)
    if (selectedAgent.config?.configurable) {
      selectedAgent.config.configurable.subagents = updatedSubAgents;
    }

    // Force a re-render to update the hierarchy navigation
    setSubAgentsVersion(prev => prev + 1);

    // Immediately switch to editing the new sub-agent
    const newIndex = updatedSubAgents.length - 1;
    setCurrentEditTarget({
      type: "subagent",
      subAgent: newSubAgent,
      index: newIndex
    });

    toast.success(`Created ${newSubAgent.name} - ready to edit!`);
  };

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex min-h-64 max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Agent Editor
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to the Agent Editor! To continue, please select an
              agent to chat with and view its configuration.
            </p>
          </div>
          <div className="mb-24 grid grid-cols-[1fr_auto] gap-4 px-6 pt-4">
            <AgentsCombobox
              placeholder="Select an agent..."
              disableDeselect
              agents={agents}
              agentsLoading={loading}
              value={value}
              setValue={(v) =>
                Array.isArray(v)
                  ? handleValueChange(v[0])
                  : handleValueChange(v)
              }
              open={open}
              setOpen={setOpen}
            />
            <Button onClick={handleStartChat}>Start</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen gap-4 p-4">
      {/* Left column - Hierarchy Navigation */}
      <div className="w-64 flex-shrink-0">
        {selectedAgent && currentEditTarget && (
          <AgentHierarchyNav
            key={subAgentsVersion} // Force re-render when sub-agents change
            agent={selectedAgent}
            currentTarget={currentEditTarget}
            onTargetChange={setCurrentEditTarget}
            onCreateSubAgent={handleCreateSubAgent}
          />
        )}
      </div>

      {/* Middle column - Agent Configuration */}
      <div className="flex-1">
        <div className="border-border flex min-h-0 flex-1 flex-col rounded-xl border bg-white h-full">
          {currentEditTarget && (
            <AgentConfig
              agent={selectedAgent || null}
              editTarget={currentEditTarget}
              onAgentUpdated={refreshAgents}
            />
          )}
        </div>
      </div>

      {/* Right column - Chat with Agent */}
      <div className="w-1/4">
        <DeepAgentChatInterface
          assistantId={agentId}
          deploymentUrl={selectedDeployment?.deploymentUrl || ""}
          accessToken={session.accessToken || ""}
          optimizerDeploymentUrl={
            process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || ""
          }
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
  );
}

/**
 * Editor page (/editor).
 * Contains a chat UI on the left and agent configuration on the right.
 */
export default function EditorPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading editor...</div>}>
      <AgentsProvider>
        <MCPProvider>
          <EditorPageContent />
        </MCPProvider>
      </AgentsProvider>
    </React.Suspense>
  );
}