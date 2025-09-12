"use client";

import { AgentInbox } from "@/features/agent-inbox";
import React from "react";
import { ThreadsProvider } from "@/features/agent-inbox/contexts/ThreadContext";
import { Toaster } from "@/components/ui/sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { AgentsProvider } from "@/providers/Agents";

export default function InboxPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Toaster />
      <AgentsProvider>
        <ThreadsProvider>
          <div className="w-full">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
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
        </ThreadsProvider>
      </AgentsProvider>
    </React.Suspense>
  );
}
