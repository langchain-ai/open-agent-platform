"use client";

import * as React from "react";
import {
  Wrench,
  Bot,
  MessageCircle,
  Brain,
  Inbox,
  Webhook,
} from "lucide-react";
import { useFlags } from "launchdarkly-react-client-sdk";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./sidebar-header";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Chat",
      url: "/chat",
      icon: MessageCircle,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: Bot,
    },
    {
      title: "Tools",
      url: "/tools",
      icon: Wrench,
    },
    {
      title: "Inbox",
      url: "/inbox",
      icon: Inbox,
    },
    {
      title: "Triggers",
      url: "/triggers",
      icon: Webhook,
    },
    {
      title: "RAG",
      url: "/rag",
      icon: Brain,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { showTriggersTab } = useFlags();

  const filteredNavItems = React.useMemo(() => {
    return data.navMain.filter((item) => {
      if (item.title === "Triggers") {
        return showTriggersTab;
      }
      return true;
    });
  }, [showTriggersTab]);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SiteHeader />
      <SidebarContent>
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
