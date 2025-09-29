"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { AgentDropdown } from "./agent-dropdown";
import { ChatNavItem } from "./chat-nav-item";

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
