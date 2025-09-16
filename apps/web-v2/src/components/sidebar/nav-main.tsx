"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import NextLink from "next/link";
import { cn } from "@/lib/utils";
import { AgentDropdown } from "./agent-dropdown";
import { AgentCreatorSheet } from "../agent-creator-sheet";

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
          <span className={cn(pathname === item.url && "font-semibold")}>
            {item.title}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </NextLink>
  );
}

export function NavMain({
  items,
  groupLabel,
}: {
  items: (
    | {
        title: string;
        url: string;
        icon?: LucideIcon;
        isDropdown?: false;
        isAgentCreator?: boolean;
        subItems?: {
          title: string;
          url: string;
        }[];
      }
    | {
        title: string;
        url?: string;
        icon?: LucideIcon;
        isDropdown: true;
        subItems?: {
          title: string;
          url: string;
        }[];
      }
  )[];
  groupLabel?: string;
}) {
  return (
    <SidebarGroup className="gap-1">
      {groupLabel && (
        <SidebarGroupLabel className="mb-1 text-xs">
          {groupLabel}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className="gap-2">
        {items.map((item, index) =>
          item.isDropdown ? (
            <AgentDropdown
              key={`${item.title}-${index}`}
              item={item}
            />
          ) : item.isAgentCreator ? (
            <AgentCreatorSheet key={`${item.title}-${index}`} />
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
