"use client";

import NextLink from "next/link";
import React, { useState, useCallback } from "react";
import { useFlags } from "launchdarkly-react-client-sdk";
import { toast } from "sonner";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { cn } from "@/lib/utils";
import { Inbox, Settings, MessagesSquare, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);
  const [threadId, setThreadId] = useQueryState("threadId");
  const [_agentId, setAgentId] = useQueryState("agentId");
  const [_deploymentId, setDeploymentId] = useQueryState("deploymentId");
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

  const handleSettingsClick = () => {
    if (!selectedAgent) {
      toast.info("Please select an agent", { richColors: true });
      return;
    }
    setShowEditDialog(true);
  };

  const handleHistoryClick = useCallback(() => {
    setIsThreadHistoryOpen((prev) => !prev);
  }, []);

  const handleThreadSelect = useCallback(
    async (newThreadId: string) => {
      if (!selectedAgent) {
        toast.info("Please select an agent", { richColors: true });
        return;
      }
      await setThreadId(newThreadId);
      setIsThreadHistoryOpen(false);
    },
    [selectedAgent, setThreadId],
  );

  const handleNewThreadClick = async () => {
    if (!selectedAgent) {
      toast.info("Please select an agent", { richColors: true });
      return;
    }
    // Start a new thread with the same agent
    await setThreadId(null);
  };

  const handleAgentSelection = useCallback(
    async (newAgentId: string, newDeploymentId: string) => {
      await setAgentId(newAgentId);
      await setDeploymentId(newDeploymentId);
      await setThreadId(null); // Clear thread ID when switching agents
    },
    [setAgentId, setDeploymentId, setThreadId],
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
                {assistantName || "Agent"}
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
            className="shadow-icon-button size-6 rounded border border-[#E4E4E7] bg-white p-2"
          >
            <MessagesSquare className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shadow-icon-button size-6 rounded border border-[#E4E4E7] bg-white p-2"
            asChild
          >
            <NextLink
              href={`/inbox?agentInbox=${selectedAgent.assistant_id}:${selectedAgent.deploymentId}`}
            >
              <Inbox className="size-4" />
            </NextLink>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            className="shadow-icon-button size-6 rounded border border-[#E4E4E7] bg-white p-2"
          >
            <Settings className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewThreadClick}
            disabled={!threadId}
            className="shadow-icon-button size-6 rounded border border-[#2F6868] bg-[#2F6868] p-2 text-white hover:bg-[#2F6868] hover:text-gray-50"
          >
            <SquarePen className="size-4" />
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
