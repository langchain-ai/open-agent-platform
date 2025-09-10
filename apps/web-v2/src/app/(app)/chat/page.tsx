"use client";
import React, { useState } from "react";
import { AgentsProvider } from "@/providers/Agents";
import DeepAgentChatPageContent from "@/features/chat";
import { Toaster } from "@/components/ui/sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";

function PageHeader({
  view,
  setView,
}: {
  view: "chat" | "workflow";
  setView: (v: "chat" | "workflow") => void;
}) {
  return (
    <header className="relative flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <span className="text-muted-foreground">›</span>
        <span className="text-sm font-medium">main agent</span>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <div
          className="flex h-[24px] w-[134px] items-center gap-0 overflow-hidden rounded border bg-white p-[3px] text-[12px] shadow-sm"
          style={{
            borderColor: "var(--Colours-Borders-border-primary, #D1D1D6)",
          }}
        >
          <button
            type="button"
            onClick={() => setView("chat")}
            className={`flex h-full flex-1 items-center justify-center truncate rounded p-[3px]`}
            style={
              view === "chat"
                ? {
                    background: "#F4F3FF",
                  }
                : undefined
            }
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setView("workflow")}
            className={`flex h-full flex-1 items-center justify-center truncate rounded p-[3px]`}
            style={
              view === "workflow"
                ? {
                    background: "#F4F3FF",
                  }
                : undefined
            }
          >
            Workflow
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Deep Agent Chat page (/chat).
 * Contains the deep agent chat interface.
 */
export default function DeepAgentChatPage(): React.ReactNode {
  const [view, setView] = useState<"chat" | "workflow">("chat");
  
  return (
    <React.Suspense fallback={<div>Loading chat...</div>}>
      <AgentsProvider>
        <PageHeader view={view} setView={setView} />
        <div className="flex min-h-0 flex-1">
          <DeepAgentChatPageContent 
            view={view} 
            onViewChange={setView} 
            hideInternalToggle={true} 
          />
        </div>
      </AgentsProvider>
      <Toaster />
    </React.Suspense>
  );
}
