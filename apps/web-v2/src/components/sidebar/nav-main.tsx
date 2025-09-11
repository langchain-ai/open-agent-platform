"use client";

import { type LucideIcon, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useAgentsContext } from "@/providers/Agents";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
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

function AgentDropdown({ item }: { item: { title: string; icon?: LucideIcon } }) {
  const { agents, loading } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [open, setOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  // Set default agent on first load
  useEffect(() => {
    if (!initialized && !loading && agents.length > 0 && !agentId) {
      // Find the default agent
      const defaultAgent = agents.find(isUserSpecifiedDefaultAgent);
      if (defaultAgent) {
        setAgentId(`${defaultAgent.assistant_id}:${defaultAgent.deploymentId}`);
      } else {
        // Fallback to first agent if no default found
        const firstAgent = agents[0];
        setAgentId(`${firstAgent.assistant_id}:${firstAgent.deploymentId}`);
      }
      setInitialized(true);
    }
  }, [agents, loading, agentId, setAgentId, initialized]);

  const handleAgentChange = (value: string | string[]) => {
    const agentValue = Array.isArray(value) ? value[0] : value;
    const [assistantId, deploymentId] = agentValue.split(":");
    // Navigate to chat page with the selected agent
    router.push(`/chat?agentId=${assistantId}:${deploymentId}&deploymentId=${deploymentId}`);
  };

  const selectedAgent = agentId ? (() => {
    const [selectedAssistantId, selectedDeploymentId] = agentId.split(":");
    return agents.find(
      (agent) =>
        agent.assistant_id === selectedAssistantId &&
        agent.deploymentId === selectedDeploymentId,
    );
  })() : null;

  return (
    <Collapsible defaultOpen>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50",
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
                  <span style={{ fontSize: '13px' }}>Loading agents...</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ) : (
              agents.map((agent) => {
                const agentValue = `${agent.assistant_id}:${agent.deploymentId}`;
                const isSelected = agentId === agentValue;
                return (
                  <SidebarMenuSubItem key={agentValue}>
                    <SidebarMenuSubButton
                      onClick={() => handleAgentChange(agentValue)}
                      className={cn(
                        "cursor-pointer",
                        isSelected && "bg-sidebar-accent text-sidebar-accent-foreground font-bold"
                      )}
                    >
                      <span style={{ fontSize: '13px' }}>{agent.name}</span>
                    </SidebarMenuSubButton>
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
  const pathname = usePathname();

  return (
    <SidebarGroup className="gap-1">
      {groupLabel && <SidebarGroupLabel className="mb-1 text-xs">{groupLabel}</SidebarGroupLabel>}
      <SidebarMenu className="gap-0.5">
        {items.map((item, index) => (
          item.isDropdown ? (
            <AgentDropdown key={`${item.title}-${index}`} item={item} />
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
            <NextLink
              href={item.url}
              key={`${item.title}-${index}`}
            >
              <SidebarMenuItem
                className={cn(
                  pathname === item.url &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span className={cn(
                    pathname === item.url && "font-bold"
                  )}>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </NextLink>
          )
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
