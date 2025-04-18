"use client";

import React from "react";
import { StreamProvider } from "@/components/chat/providers/Stream";
import { Thread } from "./components/thread";
import { ConfigurationSidebar } from "./components/configuration-sidebar";

/**
 * The parent component containing the chat interface.
 */
export default function ChatInterface(): React.ReactNode {
  return (
    <StreamProvider>
      <div className="flex h-full overflow-x-hidden">
        <div className="flex h-full flex-1 flex-col p-4">
          <Thread />
        </div>
        <ConfigurationSidebar />
      </div>
    </StreamProvider>
  );
}
