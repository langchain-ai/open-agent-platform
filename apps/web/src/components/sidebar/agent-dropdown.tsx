"use client";

import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
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
import { usePathname } from "next/navigation";
import { useDeployment } from "@/lib/environment/deployments";

export function AgentDropdown({
  item,
}: {
  item: { title: string; icon?: LucideIcon };
}) {
  const { agents, loading } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useDeployment();
  const [_threadId, setThreadId] = useQueryState("threadId");
  const [selectOpen, setSelectOpen] = useState(false);
  // get the current pathname
  const pathname = usePathname();

  // Set default agent on first page load or handle missing deploymentId
  useEffect(() => {
    if (
      !loading &&
      agents.length > 0 &&
      pathname.includes("/chat") &&
      (!agentId || !deploymentId)
    ) {
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
  }, [
    agents,
    loading,
    agentId,
    deploymentId,
    setAgentId,
    setDeploymentId,
    pathname,
  ]);

  const handleAgentChange = async (value: string) => {
    const [assistantId, deploymentIdFromValue] = value.split(":");
    await setAgentId(assistantId);
    await setDeploymentId(deploymentIdFromValue);
    // Clear any previously selected thread when switching agents
    await setThreadId(null);
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
        setValue={(value) => {
          const singleValue = Array.isArray(value) ? value[0] : value;
          handleAgentChange(singleValue);
        }}
        disableDeselect
        className="w-full rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        trigger={
          <div className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-1 text-left hover:bg-gray-50">
            {item.icon && <item.icon className="mr-2 size-4" />}
            <p className="flex-1 truncate text-sm">
              {loading ? "Loading..." : selectedAgent?.name || item.title}
            </p>
            {selectOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </div>
        }
        triggerAsChild
        open={selectOpen}
        setOpen={setSelectOpen}
      />
    </SidebarMenuItem>
  );
}
