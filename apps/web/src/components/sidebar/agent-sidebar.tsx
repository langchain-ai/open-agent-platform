"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";
import { formatTimeElapsed, useAgentSummaries } from "@/features/chat/utils";
import { getAgentColor } from "@/features/agents/utils";
import { useSidebar } from "../ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AgentSidebar() {
  const [selectedAgentId, setSelectedAgentId] = useQueryState("agentId");
  const [_currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [_sidebar, setSidebar] = useQueryState("sidebar");
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
          {agentSummaries.data?.map(({ agent, latestThread, interrupted }) => {
            const isSelected = selectedAgentId === agent.assistant_id;

            return (
              <Tooltip key={agent.assistant_id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setSelectedAgentId(agent.assistant_id);
                      setCurrentThreadId(null);
                      setSidebar("1");
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
                        "relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] leading-[24px] font-semibold text-white",
                        isSelected && "ring-2 ring-[#2F6868] ring-offset-2",
                      )}
                      style={{ backgroundColor: getAgentColor(agent.name) }}
                    >
                      {agent.name?.slice(0, 2).toUpperCase()}

                      {interrupted && sidebar.state === "collapsed" && (
                        <span className="border-sidebar absolute -right-1 -bottom-1 flex size-3 items-center justify-center rounded-full border-[2px] bg-red-500 px-1 text-xs text-white" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm">
                      {agent.name}
                    </span>
                    {interrupted && sidebar.state === "expanded" && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-center text-[11px] leading-[18px] text-white">
                        {interrupted}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  hidden={sidebar.state !== "collapsed" || sidebar.isMobile}
                >
                  <span>{agent.name}</span>
                  <p className="flex-1 truncate text-xs opacity-75">
                    {latestThread
                      ? `${latestThread.status === "busy" ? "Busy • " : ""}Last thread ${formatTimeElapsed(latestThread.updatedAt)}${interrupted ? ` • ${interrupted} interrupt${interrupted === "1" ? "" : "s"}` : ""}`
                      : interrupted
                        ? `${interrupted} interrupt${interrupted === "1" ? "" : "s"}`
                        : "No recent activity"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
