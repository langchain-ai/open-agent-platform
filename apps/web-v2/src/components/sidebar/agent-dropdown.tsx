"use client";

import { type LucideIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useAgentsContext } from "@/providers/Agents";
import { isUserSpecifiedDefaultAgent } from "@/lib/agent-utils";
import { useEffect, useState } from "react";

import {
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { AgentsCombobox } from "@/components/ui/agents-combobox";

export function AgentDropdown({
  item,
}: {
  item: { title: string; icon?: LucideIcon };
}) {
  const { agents, loading } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [initialized, setInitialized] = useState(false);

  // Set default agent on first page load or handle missing deploymentId
  useEffect(() => {
    if (!initialized && !loading && agents.length > 0) {
      if (!agentId || !deploymentId) {
        const defaultAgent = agents.find(isUserSpecifiedDefaultAgent);
        if (defaultAgent) {
          setAgentId(defaultAgent.assistant_id);
          setDeploymentId(defaultAgent.deploymentId);
        } else {
          const firstAgent = agents[0];
          setAgentId(firstAgent.assistant_id);
          setDeploymentId(firstAgent.deploymentId);
        }
      }
      setInitialized(true);
    }
  }, [
    agents,
    loading,
    agentId,
    deploymentId,
    setAgentId,
    setDeploymentId,
    initialized,
  ]);

  const handleAgentChange = (value: string) => {
    const [assistantId, deploymentIdFromValue] = value.split(":");
    setAgentId(assistantId);
    setDeploymentId(deploymentIdFromValue);
  };

  const selectedAgent =
    agentId && deploymentId
      ? agents.find(
          (agent) =>
            agent.assistant_id === agentId &&
            agent.deploymentId === deploymentId,
        )
      : null;

  const currentValue =
    agentId && deploymentId ? `${agentId}:${deploymentId}` : "";
  const { state } = useSidebar();

  // When sidebar is collapsed, show a simple button with icon and tooltip
  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={selectedAgent?.name || item.title}>
          {item.icon && <item.icon />}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // When sidebar is expanded, show the full combobox
  return (
    <SidebarMenuItem className="[&_[cmdk-list]]:max-h-[400px] [&_[cmdk-list]]:overflow-y-auto">
      <AgentsCombobox
        agents={agents}
        agentsLoading={loading}
        placeholder={item.title}
        value={currentValue}
        setValue={(value) =>
          handleAgentChange(Array.isArray(value) ? value[0] : value)
        }
        disableDeselect
        className="w-full rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
        trigger={
          <div className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-1 text-left shadow-sm hover:bg-gray-50">
            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
            <span className="flex-1 truncate">
              {loading ? "Loading..." : selectedAgent?.name || item.title}
            </span>
          </div>
        }
        triggerAsChild
      />
    </SidebarMenuItem>
  );
}
