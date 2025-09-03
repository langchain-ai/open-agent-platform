"use client";

import { AgentInbox } from "@/components/agent-inbox";
import React from "react";
import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { InboxSidebar, InboxSidebarTrigger } from "@/components/inbox-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function InboxPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Toaster />
      <ThreadsProvider>
        <div className="flex w-full flex-row">
          <div className="w-full">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>Inbox</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <AgentInbox />
          </div>

          <div className="flex-none">
            <SidebarProvider style={{ width: "auto" }}>
              <InboxSidebar />
              <InboxSidebarTrigger isOutside={true} />
            </SidebarProvider>
          </div>
        </div>
      </ThreadsProvider>
    </React.Suspense>
  );
}
