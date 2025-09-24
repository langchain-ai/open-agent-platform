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
import { SquarePen, Bot } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentHierarchyNav, EditTarget } from "@/components/AgentHierarchyNav";
import { SubAgent } from "@/types/sub-agent";
import { InitialInputs } from "./components/initial-inputs";

export function EditorPageContent(): React.ReactNode {
  const { session } = useAuthContext();
  const { agents, refreshAgents } = useAgentsContext();
  const deployments = getDeployments();

  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [_threadId, setThreadId] = useQueryState("threadId");
  const [newAgent] = useQueryState("new");

  // State for hierarchical editing
  const [currentEditTarget, setCurrentEditTarget] = useState<EditTarget | null>(
    null,
  );

  // Auto-select first agent if none selected and we have agents
  useEffect(() => {
    if (!agentId && !newAgent && agents.length > 0) {
      const firstAgent = agents[0];
      setAgentId(firstAgent.assistant_id);
      setDeploymentId(firstAgent.deploymentId);
    }
  }, [agentId, newAgent, agents, setAgentId, setDeploymentId]);

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


  const handleAgentChange = async (value: string) => {
    const [selectedAgentId, selectedDeploymentId] = value.split(":");
    await setAgentId(selectedAgentId);
    await setDeploymentId(selectedDeploymentId);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header with Agent Selector */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-800">Agent Editor</h1>
            <Select
              value={agentId && deploymentId ? `${agentId}:${deploymentId}` : ""}
              onValueChange={handleAgentChange}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select agent to edit..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem
                    key={`${agent.assistant_id}:${agent.deploymentId}`}
                    value={`${agent.assistant_id}:${agent.deploymentId}`}
                  >
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span>{agent.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/editor?new=true"}
            className="border-[#2F6868] text-[#2F6868] hover:bg-[#2F6868] hover:text-white"
          >
            Create New Agent
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4">
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
    </div>
  );
}
