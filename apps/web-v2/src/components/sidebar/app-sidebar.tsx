"use client";

import * as React from "react";
import {
  Settings,
  Puzzle,
  MessageCircle,
  Bot,
  Plus,
  Edit,
  type LucideIcon,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./sidebar-header";
import { useQueryState } from "nuqs";

interface NavigationItems {
  topNav: {
    title: string;
    url: string;
    icon: LucideIcon;
    isAgentCreator?: boolean;
  }[];
  workspace: (
    | {
        title: string;
        url: string;
        icon: LucideIcon;
        isDropdown?: false;
      }
    | {
        title: string;
        icon: LucideIcon;
        isDropdown: true;
      }
  )[];
}

const createNavigationItems = (
  agentId: string | null,
  deploymentId: string | null,
): NavigationItems => ({
  topNav: [
    {
      title: "New Agent",
      url: "/editor",
      icon: Plus,
      isAgentCreator: true,
    },
    {
      title: "Agent Library",
      url: "/agents",
      icon: Puzzle,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
  workspace: [
    {
      title: "Select Agent",
      icon: Bot,
      isDropdown: true,
    },
    {
      title: "Inbox",
      url:
        agentId && deploymentId
          ? `/agents/chat?agentId=${agentId}&deploymentId=${deploymentId}`
          : "/agents/chat",
      icon: MessageCircle,
    },
    {
      title: "Editor",
      url:
        agentId && deploymentId
          ? `/editor?agentId=${agentId}&deploymentId=${deploymentId}`
          : "/editor",
      icon: Edit,
    },
  ],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");

  const navItems = React.useMemo(
    () => createNavigationItems(agentId, deploymentId),
    [agentId, deploymentId],
  );

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SiteHeader />
      <SidebarContent>
        <NavMain items={navItems.topNav} />
        <NavMain
          items={navItems.workspace}
          groupLabel="Workspace"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
