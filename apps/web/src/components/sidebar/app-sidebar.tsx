"use client";

import * as React from "react";
import {
  Settings,
  Puzzle,
  MessageCircle,
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

interface NavigationItems {
  mainNav: {
    title: string;
    url: string;
    icon: LucideIcon;
    isAgentCreator?: boolean;
  }[];
}

const createNavigationItems = (): NavigationItems => ({
  mainNav: [
    {
      title: "New Agent",
      url: "/editor?new=true",
      icon: Plus,
      isAgentCreator: true,
    },
    {
      title: "Agent Library",
      url: "/agents",
      icon: Puzzle,
    },
    {
      title: "Editor",
      url: "/editor",
      icon: Edit,
    },
    {
      title: "Chat",
      url: "/agents/chat",
      icon: MessageCircle,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navItems = React.useMemo(() => createNavigationItems(), []);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SiteHeader />
      <SidebarContent>
        <NavMain items={navItems.mainNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
