"use client";

import React, { useState, useCallback } from "react";
import { useFlags } from "launchdarkly-react-client-sdk";
import { toast } from "sonner";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { cn } from "@/lib/utils";
import { Inbox, Settings, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { EditIcon } from "@/components/icons/edit-icon";
import { EditAgentDialog } from "@/features/agents/components/create-edit-agent-dialogs/edit-agent-dialog";
import { ThreadHistorySidebar } from "./thread-history-sidebar";
import { useAgentsContext } from "@/providers/Agents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Agent } from "@/types/agent";

interface PageHeaderProps {
  view: "chat" | "workflow";
  setView: (v: "chat" | "workflow") => void;
  assistantName?: string;
  showToggle?: boolean;
  selectedAgent?: Agent;
}

export function PageHeader({
  view,
  setView,
  assistantName,
  showToggle = false,
  selectedAgent,
}: PageHeaderProps) {
  const { showAgentVisualizerUi } = useFlags<LaunchDarklyFeatureFlags>();
  const isWorkflowEnabled = showAgentVisualizerUi !== false;
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);
  const [threadId] = useQueryState("threadId");
  const { agents, loading } = useAgentsContext();

  const handleViewChange = (newView: "chat" | "workflow") => {
    if (newView === "workflow" && !isWorkflowEnabled) {
      toast.info("Workflow view is coming soon!", {
        richColors: true,
      });
      return;
    }
    setView(newView);
  };

  const handleInboxClick = () => {
    if (selectedAgent) {
      const agentInboxId = `${selectedAgent.assistant_id}:${selectedAgent.deploymentId}`;
      router.push(`/inbox?agentInbox=${agentInboxId}`);
    }
  };

  const handleSettingsClick = () => {
    if (selectedAgent) {
      setShowEditDialog(true);
    }
  };

  const handleHistoryClick = useCallback(() => {
    setIsThreadHistoryOpen((prev) => !prev);
  }, []);

  const handleThreadSelect = useCallback(
    (threadId: string) => {
      if (selectedAgent) {
        const newUrl = `/chat?agentId=${selectedAgent.assistant_id}&deploymentId=${selectedAgent.deploymentId}&threadId=${threadId}`;
        window.location.href = newUrl;
      }
      setIsThreadHistoryOpen(false);
    },
    [selectedAgent],
  );

  const handleNewThreadClick = () => {
    // Start a new thread with the same agent
    if (selectedAgent) {
      const agentUrl = `/chat?agentId=${selectedAgent.assistant_id}&deploymentId=${selectedAgent.deploymentId}`;
      // Force a refresh to start a new thread
      window.location.href = agentUrl;
    }
  };

  const handleAgentSelection = useCallback(
    (agentId: string, deploymentId: string) => {
      // Clear all query params and set only the new agent params
      const newUrl = `/chat?agentId=${agentId}&deploymentId=${deploymentId}`;
      window.location.href = newUrl;
    },
    [],
  );

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      {showToggle && (
        <div className="flex items-center gap-2 px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-muted/50 h-8 border-none bg-transparent p-2 text-sm font-medium shadow-none focus:ring-0"
              >
                {assistantName || "main agent"}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[200px]"
            >
              {loading ? (
                <DropdownMenuItem disabled>Loading agents...</DropdownMenuItem>
              ) : (
                agents.map((agent) => (
                  <DropdownMenuItem
                    key={`${agent.assistant_id}:${agent.deploymentId}`}
                    onClick={() =>
                      handleAgentSelection(
                        agent.assistant_id,
                        agent.deploymentId,
                      )
                    }
                    className="cursor-pointer"
                  >
                    {agent.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {showToggle && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex h-[24px] w-[134px] items-center gap-0 overflow-hidden rounded border border-[#D1D1D6] bg-white p-[3px] text-[12px] shadow-sm">
            <button
              type="button"
              onClick={() => handleViewChange("chat")}
              className={cn(
                "flex h-full flex-1 items-center justify-center truncate rounded p-[3px]",
                view === "chat" && "bg-gray-200",
              )}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("workflow")}
              className={cn(
                "flex h-full flex-1 items-center justify-center truncate rounded p-[3px]",
                view === "workflow" && "bg-gray-200",
                !isWorkflowEnabled && "cursor-not-allowed opacity-50",
              )}
            >
              Workflow
            </button>
          </div>
        </div>
      )}
      {showToggle && selectedAgent && (
        <div className="absolute right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHistoryClick}
            className="h-8 w-8 rounded border border-[#E4E4E7] bg-white p-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
            style={{ borderRadius: "4px" }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleInboxClick}
            className="h-8 w-8 rounded border border-[#E4E4E7] bg-white p-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
            style={{ borderRadius: "4px" }}
          >
            <Inbox className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            className="h-8 w-8 rounded border border-[#E4E4E7] bg-white p-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]"
            style={{ borderRadius: "4px" }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewThreadClick}
            className="h-8 w-8 rounded border border-[#2F6868] bg-[#2F6868] p-2 shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] hover:bg-[#2F6868]"
            style={{ borderRadius: "4px" }}
          >
            <EditIcon />
          </Button>
        </div>
      )}
      {selectedAgent && (
        <EditAgentDialog
          agent={selectedAgent}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}
      {selectedAgent && (
        <ThreadHistorySidebar
          open={isThreadHistoryOpen}
          setOpen={setIsThreadHistoryOpen}
          currentThreadId={threadId}
          onThreadSelect={handleThreadSelect}
        />
      )}
    </header>
  );
}
