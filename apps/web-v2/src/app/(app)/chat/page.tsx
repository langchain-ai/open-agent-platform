"use client";
import React from "react";
import { AgentsProvider } from "@/providers/Agents";
import DeepAgentChatPageContent from "@/features/chat";
import { Toaster } from "@/components/ui/sonner";
/**
 * Deep Agent Chat page (/chat).
 * Contains the deep agent chat interface.
 */
export default function DeepAgentChatPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading chat...</div>}>
      <AgentsProvider>
        <DeepAgentChatPageContent />
      </AgentsProvider>
      <Toaster />
    </React.Suspense>
  );
}
