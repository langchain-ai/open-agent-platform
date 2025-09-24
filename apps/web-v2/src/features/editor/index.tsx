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
import { AgentSelector } from "./components/agent-selector";

export function EditorPageContent(): React.ReactNode {
  const { session } = useAuthContext();
  const { agents, refreshAgents } = useAgentsContext();
  const deployments = getDeployments();

  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");
  const [_threadId, setThreadId] = useQueryState("threadId");
  const [newAgent] = useQueryState("new");

  // State for hierarchical editing
  const [currentEditTarget, setCurrentEditTarget] = useState<EditTarget | null>(
    null,
  );

  // Force re-render when sub-agents change
  const [subAgentsVersion, setSubAgentsVersion] = useState(0);
  const [chatVersion, setChatVersion] = useState(0);

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

  if (!session) {
    return <div>Loading...</div>;
  }

  // Show new agent creation form if new=true parameter is present
  if (newAgent === "true") {
    return <InitialInputs />;
  }

  // Show agent selector if no agent is selected
  if (!agentId || !deploymentId) {
    return <AgentSelector />;
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
            onDeleteSubAgent={handleDeleteSubAgent}
          />
        )}
      </div>

      {/* Middle column - Agent Configuration */}
      <div className="flex-1">
        <div className="border-border flex h-full min-h-0 flex-1 flex-col rounded-xl border bg-white">
          {currentEditTarget && (
            <AgentConfig
              agent={selectedAgent || null}
              editTarget={currentEditTarget}
              onAgentUpdated={handleAgentUpdated}
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
    </div>
  );
}
