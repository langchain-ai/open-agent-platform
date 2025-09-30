"use client";

import React, { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import type { Thread } from "@langchain/langgraph-sdk";
import type { AgentSummary, ThreadItem } from "../types";
import { format } from "date-fns";
import { useAgentsContext } from "@/providers/Agents";
import {
  useThreads,
  getThreadColor,
  formatTime,
  formatTimeElapsed,
} from "../utils";
import { getAgentColor } from "@/features/agents/utils";
import { useQueryState } from "nuqs";
import { useDeployment } from "@/lib/environment/deployments";

export function ThreadHistoryAgentList({
  onThreadSelect,
  showDraft,
  className,
  statusFilter = "all",
}: {
  onThreadSelect: (id: string, assistantId?: string) => void;
  showDraft?: string;
  className?: string;
  statusFilter?: "all" | "idle" | "busy" | "interrupted" | "error";
}) {
  const [currentThreadId] = useQueryState("threadId");
  const [deploymentId] = useDeployment();
  const [selectedAgentId] = useQueryState("agentId");
  const { agents } = useAgentsContext();

  // TODO: remove once the draft thread is handled differently
  const agent = useMemo(
    () =>
      agents.find(
        (a) =>
          a.deploymentId === deploymentId && a.assistant_id === selectedAgentId,
      ),
    [agents, deploymentId, selectedAgentId],
  );

  const threads = useThreads();

  const displayItems = useMemo(() => {
    if (showDraft != null && !currentThreadId && agent) {
      const draft: ThreadItem = {
        id: "__draft__",
        updatedAt: new Date(),
        status: "draft",
        title: showDraft,
        description: "Draft thread",
      };
      return [draft, ...(threads.data ?? [])];
    }
    return threads.data ?? [];
  }, [showDraft, currentThreadId, agent, threads.data]);

  const grouped = useMemo(() => {
    const groups: Record<string, ThreadItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };
    const now = new Date();
    const base =
      statusFilter === "all"
        ? displayItems
        : displayItems.filter((t) => t.status === statusFilter);
    base.forEach((t) => {
      const diff = now.getTime() - t.updatedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) groups.today.push(t);
      else if (days === 1) groups.yesterday.push(t);
      else if (days < 7) groups.week.push(t);
      else groups.older.push(t);
    });
    return groups;
  }, [displayItems, statusFilter]);

  return (
    <div className={cn("flex h-full w-full flex-shrink-0 flex-col", className)}>
      <div className="relative flex h-full">
        {/* Main Content Area */}
        <ScrollArea className="h-full w-full">
          {threads.isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center p-12">
              Loading threads...
            </div>
          ) : !displayItems?.length ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center">
              <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="box-border w-full max-w-full overflow-hidden p-2">
              {Object.entries(grouped)
                .filter(([_, threads]) => threads.length > 0)
                .map(([key, threads]) => (
                  <Group
                    key={key}
                    label={key}
                  >
                    {threads.map((t) => (
                      <Row
                        key={t.id}
                        {...t}
                        time={format(t.updatedAt, "MM/dd/yyyy hh:mm a")}
                        active={
                          t.id === currentThreadId ||
                          (t.id === "__draft__" && !currentThreadId)
                        }
                        onClick={() => {
                          if (t.id !== "__draft__")
                            onThreadSelect(t.id, t.assistantId);
                        }}
                      />
                    ))}
                  </Group>
                ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h4 className="text-muted-foreground m-0 px-3 py-2 text-xs font-semibold tracking-wide uppercase">
        {label}
      </h4>
      {children}
    </div>
  );
}

function Row({
  id,
  title,
  description,
  status,
  time,
  active,
  onClick,
}: {
  id: string;
  title: string;
  description: string;
  status: Thread["status"] | "draft";
  time: string;
  active: boolean;
  onClick: () => void;
}) {
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return format(date, "HH:mm");
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return format(date, "EEEE");
    } else {
      return format(date, "MM/dd");
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "grid w-full cursor-pointer items-center gap-3 rounded-lg border-none px-3 py-3 text-left transition-colors duration-200 hover:bg-gray-100",
        active
          ? "border-l-4 border-l-gray-300 bg-gray-100 text-[#1A1A1E]"
          : "bg-transparent",
      )}
      aria-current={active}
    >
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {title}
          </h3>
          <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
            {formatTime(time)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="flex-1 truncate text-sm text-gray-600">{description}</p>
          {/* Status indicator */}
          <div className="ml-2 flex-shrink-0">
            <div
              className={cn("h-2 w-2 rounded-full", getThreadColor({ status }))}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export function AgentSummaryCard({
  summary,
  onClick,
}: {
  summary: AgentSummary;
  onClick: () => void;
}) {
  const { agent, latestThread, interrupted } = summary;

  return (
    <button
      onClick={onClick}
      className="grid w-full cursor-pointer grid-cols-[auto_1fr] items-center gap-3 rounded-lg border-none px-3 py-3 text-left transition-colors duration-200 hover:bg-gray-100"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: getAgentColor(agent.name) }}
        >
          {agent.name?.slice(0, 2).toUpperCase()}
        </div>

        {interrupted ? (
          <span className="border-sidebar absolute -right-1 -bottom-1 flex h-5 min-w-5 items-center justify-center rounded-full border-[2px] bg-red-500 px-1 text-xs text-white">
            {interrupted}
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {agent.name}
          </h3>
          {latestThread && (
            <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
              {formatTime(latestThread.updatedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="flex-1 truncate text-sm text-gray-600">
            {latestThread
              ? `${latestThread.status === "busy" ? "Busy • " : ""}Last thread ${formatTimeElapsed(latestThread.updatedAt)}${interrupted ? ` • ${interrupted} interrupt${interrupted === "1" ? "" : "s"}` : ""}`
              : interrupted
                ? `${interrupted} interrupt${interrupted === "1" ? "" : "s"}`
                : "No recent activity"}
          </p>
          {/* Status indicator for latest thread */}
          {latestThread && (
            <div className="ml-2 flex-shrink-0">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  getThreadColor(latestThread),
                )}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
