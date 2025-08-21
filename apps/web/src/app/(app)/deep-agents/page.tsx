"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { ChatBreadcrumb } from "@/features/chat/components/chat-breadcrumb";
import DeepAgentsInterface from "@/features/deep-agents";

/**
 * Deep Agents page (/deep-agents).
 * Contains the deep agents interface.
 */
export default function DeepAgentsPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <ChatBreadcrumb />
        </div>
      </header>
      <DeepAgentsInterface />
    </React.Suspense>
  );
}
