"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useFlags } from "launchdarkly-react-client-sdk";
import { toast } from "sonner";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  view: "chat" | "workflow";
  setView: (v: "chat" | "workflow") => void;
  assistantName?: string;
  showToggle?: boolean;
}

export function PageHeader({
  view,
  setView,
  assistantName,
  showToggle = false,
}: PageHeaderProps) {
  const { showAgentVisualizerUi } = useFlags<LaunchDarklyFeatureFlags>();
  const isWorkflowEnabled = showAgentVisualizerUi !== false;

  const handleViewChange = (newView: "chat" | "workflow") => {
    if (newView === "workflow" && !isWorkflowEnabled) {
      toast.info("Workflow view is coming soon!", {
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
      {showToggle && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex h-[24px] w-[134px] items-center gap-0 overflow-hidden rounded border border-[#D1D1D6] bg-white p-[3px] text-[12px] shadow-sm">
            <button
              type="button"
              onClick={() => handleViewChange("chat")}
              className={cn(
                "flex h-full flex-1 items-center justify-center truncate rounded p-[3px]",
                view === "chat" && "bg-[#F4F3FF]",
              )}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("workflow")}
              className={cn(
                "flex h-full flex-1 items-center justify-center truncate rounded p-[3px]",
                view === "workflow" && "bg-[#F4F3FF]",
                !isWorkflowEnabled && "cursor-not-allowed opacity-50",
              )}
            >
              Workflow
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
