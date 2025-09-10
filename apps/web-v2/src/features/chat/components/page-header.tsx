"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useFlags } from "launchdarkly-react-client-sdk";
import { toast } from "sonner";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";

interface PageHeaderProps {
  view: "chat" | "workflow";
  setView: (v: "chat" | "workflow") => void;
  assistantName?: string;
}

export function PageHeader({ view, setView, assistantName }: PageHeaderProps) {
  // LaunchDarkly feature flag for workflow
  const { showAgentVisualizerUi } = useFlags<LaunchDarklyFeatureFlags>();

  const isWorkflowEnabled = showAgentVisualizerUi !== false;

  const handleViewChange = (newView: "chat" | "workflow") => {
    if (newView === "workflow" && !isWorkflowEnabled) {
      toast.error("Workflow view is coming soon!", {
        richColors: true,
      });
      return;
    }
    setView(newView);
  };

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <span className="text-muted-foreground">›</span>
        <span className="text-sm font-medium">
          {assistantName || "main agent"}
        </span>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <div
          className="flex h-[24px] w-[134px] items-center gap-0 overflow-hidden rounded border bg-white p-[3px] text-[12px] shadow-sm"
          style={{
            borderColor: "D1D1D6",
          }}
        >
          <button
            type="button"
            onClick={() => handleViewChange("chat")}
            className="flex h-full flex-1 items-center justify-center truncate rounded p-[3px]"
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
            onClick={() => handleViewChange("workflow")}
            className="flex h-full flex-1 items-center justify-center truncate rounded p-[3px]"
            style={{
              ...(view === "workflow"
                ? {
                    background: "#F4F3FF",
                  }
                : undefined),
              ...(isWorkflowEnabled
                ? undefined
                : {
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }),
            }}
          >
            Workflow
          </button>
        </div>
      </div>
    </header>
  );
}
