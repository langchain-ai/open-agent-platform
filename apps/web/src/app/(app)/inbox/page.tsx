"use client";

import { AgentInbox } from "@/components/agent-inbox";
import React from "react";
import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/ui/header";
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
        <div className="flex min-h-full w-full flex-row">
          {/* Header */}
          <div className="w-full">
            <Header>
              <SidebarTrigger className="-ml-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Inbox</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </Header>

            {/* Main content */}
            <div className="flex h-full w-full flex-col">
              <AgentInbox />
            </div>
          </div>

          {/* Right sidebar for inbox */}
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
