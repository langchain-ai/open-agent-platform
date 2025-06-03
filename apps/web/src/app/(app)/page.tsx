"use client";

import ChatInterface from "@/features/chat";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { ChatBreadcrumb } from "@/features/chat/components/chat-breadcrumb";

/**
 * The default page (/).
 * Contains the generic chat interface.
 */
export default function ChatPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <Header>
        <SidebarTrigger className="-ml-1" />
        <ChatBreadcrumb />
      </Header>
      <ChatInterface />
    </React.Suspense>
  );
}
