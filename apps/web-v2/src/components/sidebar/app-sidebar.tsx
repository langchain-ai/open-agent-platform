"use client";

import * as React from "react";
import {
  Settings,
  Puzzle,
  MessageCircle,
  Inbox,
  Bot,
  Plus,
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

// Sidebar navigation data
const data: {
  topNav: {
    title: string;
    url: string;
    icon: LucideIcon;
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
} = {
  topNav: [
    {
      title: "New Agent",
      url: "/agents/create",
      icon: Plus,
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
      title: "Chat",
      url: "/chat",
      icon: MessageCircle,
    },
    {
      title: "Inbox",
      url: "/inbox",
      icon: Inbox,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SiteHeader />
      <SidebarContent>
        <NavMain items={data.topNav} />
        <NavMain
          items={data.workspace}
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
