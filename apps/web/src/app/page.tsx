"use client";

import ChatInterface from "@/features/chat";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { ChatBreadcrumb } from "@/features/chat/components/chat-breadcrumb";
import { ThreadsProvider } from "@/providers/Thread";

/**
 * The default page (/).
 * Contains the generic chat interface.
 */
export default function ChatPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 h-4"
          />
          <ChatBreadcrumb />
        </div>
      </header>
      <ThreadsProvider>
        <ChatInterface />
      </ThreadsProvider>
    </React.Suspense>
  );
}
