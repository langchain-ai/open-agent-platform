"use client";

import { Toaster } from "@/components/ui/sonner";
import React from "react";
import DeepAgentChatInterface from "@/features/deep-agent-chat";

/**
 * Deep Agent Chat page (/chat).
 * Contains the deep agent chat interface.
 */
export default function DeepAgentChatPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <DeepAgentChatInterface />
    </React.Suspense>
  );
}
