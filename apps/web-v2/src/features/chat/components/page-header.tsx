"use client";

import NextLink from "next/link";
import React, { useState, useCallback } from "react";
import { useFlags } from "launchdarkly-react-client-sdk";
import { toast } from "sonner";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { cn } from "@/lib/utils";
import { Inbox, Settings, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryState } from "nuqs";
import { ThreadHistorySidebar } from "./thread-history-sidebar";
import { useAgentsContext } from "@/providers/Agents";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { Agent } from "@/types/agent";
import { AgentCreatorSheet } from "@/components/agent-creator-sheet";
import { isUserSpecifiedDefaultAgent } from "@/lib/agent-utils";

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
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false);
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

  const handleThreadSelect = useCallback(
    async (newThreadId: string) => {
      if (!selectedAgent) {
        toast.info("Please select an agent", { richColors: true });
        return;
      }
      await setThreadId(newThreadId);
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
          <Popover
            open={isAgentSelectorOpen}
            onOpenChange={setIsAgentSelectorOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                role="combobox"
                aria-expanded={isAgentSelectorOpen}
                className="hover:bg-muted/50 h-8 border-none bg-transparent p-2 text-sm font-medium shadow-none focus:ring-0"
              >
                {assistantName || "Agent"}
                <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[300px] p-0"
            >
              <Command
                filter={(value: string, search: string) => {
                  const [assistantId, deploymentId] = value.split(":");
                  const agent = agents.find(
                    (a) =>
                      a.assistant_id === assistantId &&
                      a.deploymentId === deploymentId,
                  );
                  if (!agent) return 0;
                  if (agent.name.toLowerCase().includes(search.toLowerCase())) {
                    return 1;
                  }
                  return 0;
                }}
              >
                <CommandInput placeholder="Search agents..." />
                <CommandList>
                  <CommandEmpty>
                    {loading ? "Loading agents..." : "No agents found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {agents.map((agent) => {
                      const agentValue = `${agent.assistant_id}:${agent.deploymentId}`;
                      const isSelected =
                        selectedAgent?.assistant_id === agent.assistant_id &&
                        selectedAgent?.deploymentId === agent.deploymentId;

                      return (
                        <CommandItem
                          key={agentValue}
                          value={agentValue}
                          onSelect={() => {
                            handleAgentSelection(
                              agent.assistant_id,
                              agent.deploymentId,
                            );
                            setIsAgentSelectorOpen(false);
                          }}
                          className="flex items-center justify-between"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="flex-1">{agent.name}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
          <ThreadHistorySidebar
            currentThreadId={threadId}
            onThreadSelect={handleThreadSelect}
          />
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
          {!isUserSpecifiedDefaultAgent(selectedAgent) && (
            <AgentCreatorSheet
              agent={selectedAgent}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="shadow-icon-button size-6 rounded border border-[#E4E4E7] bg-white p-2"
                >
                  <Settings className="size-4" />
                </Button>
              }
            />
          )}
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
    </header>
  );
}
