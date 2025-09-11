"use client";

import { type LucideIcon, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";
import { useAgentsContext } from "@/providers/Agents";
import { isUserSpecifiedDefaultAgent } from "@/lib/agent-utils";
import { useEffect, useState } from "react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

function ChatNavItem({
  item,
}: {
  item: { title: string; url: string; icon?: LucideIcon };
}) {
  const pathname = usePathname();
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");

  // If we have a selected agent, include it in the URL for Chat and Inbox
  const href =
    agentId && deploymentId
      ? (() => {
          if (item.title === "Chat") {
            return `/chat?agentId=${agentId}&deploymentId=${deploymentId}`;
          } else if (item.title === "Inbox") {
            return `/inbox?agentInbox=${agentId}:${deploymentId}&agentId=${agentId}&deploymentId=${deploymentId}`;
          }
          return item.url;
        })()
      : item.url;

  return (
    <NextLink href={href}>
      <SidebarMenuItem
        className={cn(
          pathname === item.url &&
            "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
      >
        <SidebarMenuButton tooltip={item.title}>
          {item.icon && <item.icon />}
          <span className={cn(pathname === item.url && "font-bold")}>
            {item.title}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </NextLink>
  );
}

function AgentDropdown({
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
        // Find the default agent if no agent is selected or deploymentId is missing
        const defaultAgent = agents.find(isUserSpecifiedDefaultAgent);
        if (defaultAgent) {
          setAgentId(defaultAgent.assistant_id);
          setDeploymentId(defaultAgent.deploymentId);
        } else {
          // Fallback to first agent if no default found
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

  const handleAgentChange = (value: string | string[]) => {
    const agentValue = Array.isArray(value) ? value[0] : value;
    const [assistantId, deploymentIdFromValue] = agentValue.split(":");
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

  return (
    <Collapsible defaultOpen>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50",
            )}
          >
            {item.icon && <item.icon />}
            <span className="flex-1 text-left">
              {loading ? "Loading..." : selectedAgent?.name || item.title}
            </span>
            <ChevronDown className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {loading ? (
              <SidebarMenuSubItem>
                <SidebarMenuSubButton>
                  <span style={{ fontSize: "13px" }}>Loading agents...</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ) : (
              agents.map((agent) => {
                const agentValue = `${agent.assistant_id}:${agent.deploymentId}`;
                const isSelected =
                  agentId === agent.assistant_id &&
                  deploymentId === agent.deploymentId;
                return (
                  <SidebarMenuSubItem key={agentValue}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAgentChange(agentValue);
                      }}
                      className={cn(
                        "w-full cursor-pointer rounded px-2 py-1 text-left hover:bg-gray-100",
                        isSelected &&
                          "bg-sidebar-accent text-sidebar-accent-foreground font-bold",
                      )}
                    >
                      <span style={{ fontSize: "13px" }}>{agent.name}</span>
                    </button>
                  </SidebarMenuSubItem>
                );
              })
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain({
  items,
  groupLabel,
  onNewAgentClick,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isDropdown?: boolean;
    subItems?: {
      title: string;
      url: string;
    }[];
  }[];
  groupLabel?: string;
  onNewAgentClick?: () => void;
}) {
  return (
    <SidebarGroup className="gap-1">
      {groupLabel && (
        <SidebarGroupLabel className="mb-1 text-xs">
          {groupLabel}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="gap-0.5">
        {items.map((item, index) =>
          item.isDropdown ? (
            <AgentDropdown
              key={`${item.title}-${index}`}
              item={item}
            />
          ) : item.title === "New Agent" && onNewAgentClick ? (
            <SidebarMenuItem key={`${item.title}-${index}`}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={onNewAgentClick}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <ChatNavItem
              key={`${item.title}-${index}`}
              item={item}
            />
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
