"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UploadCloud, House } from "lucide-react";
import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { prettifyText, isDeployedUrl } from "../agent-inbox/utils";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  groupAgentsByGraphs,
  isUserCreatedDefaultAssistant,
} from "@/lib/agent-utils";
import { getDeployments } from "@/lib/environment/deployments";
import { Deployment } from "@/types/deployment";
import { parseAsString, parseAsInteger, useQueryState } from "nuqs";
import { useAgentsContext } from "@/providers/Agents";
import { Agent } from "@/types/agent";
import { useThreadsContext } from "../agent-inbox/contexts/ThreadContext";

// Internal component that uses the context
function InboxSidebarInternal() {
  const { setThreadData, fetchThreads } = useThreadsContext();
  const { agents, loading } = useAgentsContext();
  const [agentInboxId, setAgentInboxId] = useQueryState("agentInbox");
  const deployments = getDeployments();

  const [_offset, setOffset] = useQueryState(
    "offset",
    parseAsInteger.withDefault(0),
  );
  const [_limit, setLimit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(10),
  );
  const [_inbox, setInbox] = useQueryState(
    "inbox",
    parseAsString.withDefault("interrupted"),
  );

  const lastSelectedAgentRef = React.useRef<string | null>(null);

  // Function to handle agent selection
  const handleAgentSelect = async (agent: Agent) => {
    const agentId = `${agent.assistant_id}:${agent.deploymentId}`;

    // Skip if already selected to prevent loops
    if (agentId === agentInboxId) return;

    // Update ref to track last selected agent
    lastSelectedAgentRef.current = agentId;

    // Update selected agent in context
    await setAgentInboxId(agentId);
    setThreadData([]);

    await setOffset(0);
    await setLimit(10);
    await setInbox("interrupted");

    await fetchThreads(agent.assistant_id, agent.deploymentId);
  };

  return (
    <Sidebar
      className="border-r-[0px] border-l-[1px] bg-[#F9FAFB]"
      side="right"
    >
      <SidebarContent className="flex h-screen flex-col pt-6 pb-9">
        <div className="flex items-center justify-between px-5">
          <InboxSidebarTrigger
            isOutside={false}
            className="mt-1"
          />
        </div>
        <SidebarGroup className="flex-1 overflow-y-auto pt-6">
          <SidebarGroupContent className="h-full">
            <SidebarMenu className="flex h-full flex-col justify-between gap-2">
              <div className="flex flex-col gap-2 pl-5">
                {loading ? (
                  <div className="px-2 py-4 text-sm text-gray-500">
                    Loading agents...
                  </div>
                ) : (
                  <>
                    {deployments.map((deployment: Deployment) => {
                      // Filter agents for the current deployment
                      const deploymentAgents = agents.filter(
                        (agent) => agent.deploymentId === deployment.id,
                      );

                      // Skip deployments with no agents
                      if (deploymentAgents.length === 0) {
                        return null;
                      }

                      // Group agents by graph
                      const agentsByGraph =
                        groupAgentsByGraphs(deploymentAgents);

                      return (
                        <React.Fragment key={deployment.id}>
                          <div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
                            {deployment.name}
                          </div>

                          {agentsByGraph.map((graphAgents) => {
                            if (graphAgents.length === 0) return null;

                            // Use the first agent's graph_id as the group identifier
                            const graphId = graphAgents[0].graph_id;

                            return (
                              <React.Fragment
                                key={`${deployment.id}-${graphId}`}
                              >
                                {graphAgents.map((agent) => {
                                  const isDeployed = isDeployedUrl(
                                    deployment.deploymentUrl || "",
                                  );
                                  const label =
                                    agent.name || prettifyText(agent.graph_id);
                                  const isDefault =
                                    isUserCreatedDefaultAssistant(agent);
                                  // Check if this agent is selected
                                  const agentId = `${agent.assistant_id}:${agent.deploymentId}`;
                                  const isSelected = agentInboxId === agentId;

                                  return (
                                    <SidebarMenuItem
                                      key={`agent-${agent.assistant_id}`}
                                      className={cn(
                                        "flex w-full items-center justify-between",
                                        isSelected
                                          ? "rounded-md bg-gray-100"
                                          : "",
                                      )}
                                    >
                                      <TooltipProvider>
                                        <Tooltip delayDuration={200}>
                                          <TooltipTrigger asChild>
                                            <SidebarMenuButton
                                              onClick={() =>
                                                handleAgentSelect(agent)
                                              }
                                            >
                                              {isDeployed ? (
                                                <UploadCloud className="h-5 w-5 text-blue-500" />
                                              ) : (
                                                <House className="h-5 w-5 text-green-500" />
                                              )}
                                              <span
                                                className={cn(
                                                  "min-w-0 truncate font-medium",
                                                  isSelected
                                                    ? "text-black"
                                                    : "text-gray-600",
                                                )}
                                              >
                                                {isDefault
                                                  ? "Default agent"
                                                  : label}
                                              </span>
                                            </SidebarMenuButton>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {label} -{" "}
                                            {isDeployed ? "Deployed" : "Local"}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </SidebarMenuItem>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                          <div className="my-2 h-px bg-gray-200" />
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

// Exported component with the provider
export function InboxSidebar() {
  return <InboxSidebarInternal />;
}

const sidebarTriggerSVG = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 2V14M5.2 2H10.8C11.9201 2 12.4802 2 12.908 2.21799C13.2843 2.40973 13.5903 2.71569 13.782 3.09202C14 3.51984 14 4.0799 14 5.2V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.07989 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V5.2C2 4.07989 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2Z"
      stroke="#3F3F46"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function InboxSidebarTrigger({
  isOutside,
  className,
}: {
  isOutside: boolean;
  className?: string;
}) {
  const { toggleSidebar, open } = useSidebar();

  if (isOutside && open) {
    // If this component is being rendered outside the sidebar view, then do not render if open.
    // This way we can render the trigger inside the main view when open.
    return null;
  }

  return (
    <TooltipIconButton
      tooltip="Toggle Inbox Sidebar"
      onClick={toggleSidebar}
      className={cn(className, isOutside && "absolute top-4 right-4 z-50")}
    >
      {isOutside ? (
        // Custom icon when outside, pointing to the right
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 2V14M5.2 2H10.8C11.9201 2 12.4802 2 12.908 2.21799C13.2843 2.40973 13.5903 2.71569 13.782 3.09202C14 3.51984 14 4.0799 14 5.2V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.07989 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V5.2C2 4.07989 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2Z"
            stroke="#3F3F46"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        sidebarTriggerSVG
      )}
    </TooltipIconButton>
  );
}
