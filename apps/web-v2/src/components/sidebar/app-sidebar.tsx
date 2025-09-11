"use client";

import * as React from "react";
import {
  Settings,
  Puzzle,
  MessageCircle,
  Inbox,
  Bot,
  Plus,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { CreateAgentDialog } from "@/features/agents/components/create-edit-agent-dialogs/create-agent-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./sidebar-header";

// Sidebar navigation data
const data = {
  topNav: [
    {
      title: "New Agent",
      url: "/agents/new",
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
      title: "Recruiter Agent",
      url: "/agents/recruiter",
      icon: Bot,
      isDropdown: true,
      subItems: [
        {
          title: "Recruiter Agent",
          url: "/agents/recruiter",
        },
      ],
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
  const [showCreateAgentDialog, setShowCreateAgentDialog] = React.useState(false);

  return (
    <>
      <Sidebar
        collapsible="icon"
        {...props}
      >
        <SiteHeader />
        <SidebarContent className="gap-0.5">
          <NavMain 
            items={data.topNav} 
            onNewAgentClick={() => setShowCreateAgentDialog(true)}
          />
          <NavMain items={data.workspace} groupLabel="Workspace" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      
      <CreateAgentDialog
        open={showCreateAgentDialog}
        onOpenChange={setShowCreateAgentDialog}
      />
    </>
  );
}

