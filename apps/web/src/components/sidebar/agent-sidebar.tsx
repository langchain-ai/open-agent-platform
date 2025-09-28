"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";
import { useAgentSummaries } from "@/features/chat/utils";
import { getAgentColor } from "@/features/agents/utils";
import { useSidebar } from "../ui/sidebar";

export function AgentSidebar() {
  const [selectedAgentId, setSelectedAgentId] = useQueryState("agentId");
  const [_, setCurrentThreadId] = useQueryState("threadId");
  const agentSummaries = useAgentSummaries();

  const sidebar = useSidebar();

  // Only show when we have agent summaries and an agent is selected
  if (!agentSummaries.data?.length || selectedAgentId == null) {
    return null;
  }

  return (
    <div className="border-t">
      <div
        className={cn(
          "p-2 transition-all duration-200 ease-linear",
          sidebar.state === "collapsed" && "p-1",
        )}
      >
        <div className="flex flex-col">
          {agentSummaries.data?.map(({ agent, interrupted }) => {
            const isSelected = selectedAgentId === agent.assistant_id;

            return (
              <button
                key={agent.assistant_id}
                onClick={() => {
                  setSelectedAgentId(agent.assistant_id);
                  setCurrentThreadId(null);
                }}
                className={cn(
                  "hover:bg-sidebar-accent relative flex h-10 w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-200",
                  isSelected
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "",
                )}
                title={agent.name}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] leading-[24px] font-semibold text-white",
                    isSelected && "ring-2 ring-[#2F6868] ring-offset-2",
                  )}
                  style={{ backgroundColor: getAgentColor(agent.name) }}
                >
                  {agent.name?.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm">
                  {agent.name}
                </span>
                {interrupted && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-center text-[11px] leading-[18px] text-white">
                    {interrupted}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
