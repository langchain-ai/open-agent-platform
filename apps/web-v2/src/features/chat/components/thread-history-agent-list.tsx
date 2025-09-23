"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { useAuthContext } from "@/providers/Auth";
import { createClient } from "@/lib/client";
import type { Agent } from "@/types/agent";
import type { Message, Thread } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent } from "../utils";
import { format } from "date-fns";

type Props = {
  agent: Agent | null;
  deploymentId: string | null;
  currentThreadId: string | null;
  onThreadSelect: (id: string) => void;
  className?: string;
  statusFilter?: "all" | "idle" | "busy" | "interrupted" | "error";
};

type Item = {
  id: string;
  updatedAt: Date;
  status: Thread["status"];
};

export function ThreadHistoryAgentList({
  agent,
  deploymentId,
  currentThreadId,
  onThreadSelect,
  className,
  statusFilter = "all",
}: Props) {
  const { session } = useAuthContext();
  const client = useMemo(() => {
    if (!deploymentId || !session?.accessToken) return null;
    return createClient(deploymentId, session.accessToken);
  }, [deploymentId, session]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);

  const fetchThreads = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const params: Parameters<typeof client.threads.search>[0] = {
        limit: 50,
        sortBy: "created_at",
        sortOrder: "desc",
      };
      if (agent?.assistant_id) {
        params.metadata = { assistant_id: agent.assistant_id } as Record<string, string>;
      }
      const response = await client.threads.search(params);
      const mapped: Item[] = response.map((t) => ({
        id: t.thread_id,
        updatedAt: new Date(t.updated_at || t.created_at),
        status: t.status,
      }));
      setItems(
        mapped.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      );
    } finally {
      setLoading(false);
    }
  }, [client, agent?.assistant_id]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const grouped = useMemo(() => {
    const groups: Record<string, Item[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };
    const now = new Date();
    const base =
      statusFilter === "all"
        ? items
        : items.filter((t) => t.status === statusFilter);
    base.forEach((t) => {
      const diff = now.getTime() - t.updatedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) groups.today.push(t);
      else if (days === 1) groups.yesterday.push(t);
      else if (days < 7) groups.week.push(t);
      else groups.older.push(t);
    });
    return groups;
  }, [items, statusFilter]);

  const AgentTitle = agent?.name || "Agent";
  const AgentDesc =
    (agent?.metadata?.description as string | undefined) || "No description";

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      <ScrollArea className="h-[calc(100vh-100px)]">
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center p-12">
            Loading threads...
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center">
            <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
            <p>No threads yet</p>
          </div>
        ) : (
          <div className="box-border w-full max-w-full overflow-hidden p-2">
            {grouped.today.length > 0 && (
              <Group label="Today">
                {grouped.today.map((t) => (
                  <Row
                    key={t.id}
                    id={t.id}
                    title={AgentTitle}
                    description={AgentDesc}
                    status={t.status}
                    time={format(t.updatedAt, "MM/dd/yyyy hh:mm a")}
                    active={t.id === currentThreadId}
                    onClick={() => onThreadSelect(t.id)}
                  />
                ))}
              </Group>
            )}
            {grouped.yesterday.length > 0 && (
              <Group label="Yesterday">
                {grouped.yesterday.map((t) => (
                  <Row
                    key={t.id}
                    id={t.id}
                    title={AgentTitle}
                    description={AgentDesc}
                    status={t.status}
                    time={format(t.updatedAt, "MM/dd/yyyy hh:mm a")}
                    active={t.id === currentThreadId}
                    onClick={() => onThreadSelect(t.id)}
                  />
                ))}
              </Group>
            )}
            {grouped.week.length > 0 && (
              <Group label="This Week">
                {grouped.week.map((t) => (
                  <Row
                    key={t.id}
                    id={t.id}
                    title={AgentTitle}
                    description={AgentDesc}
                    status={t.status}
                    time={format(t.updatedAt, "MM/dd/yyyy hh:mm a")}
                    active={t.id === currentThreadId}
                    onClick={() => onThreadSelect(t.id)}
                  />
                ))}
              </Group>
            )}
            {grouped.older.length > 0 && (
              <Group label="Older">
                {grouped.older.map((t) => (
                  <Row
                    key={t.id}
                    id={t.id}
                    title={AgentTitle}
                    description={AgentDesc}
                    status={t.status}
                    time={format(t.updatedAt, "MM/dd/yyyy hh:mm a")}
                    active={t.id === currentThreadId}
                    onClick={() => onThreadSelect(t.id)}
                  />
                ))}
              </Group>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold uppercase tracking-wide">
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
  status: Thread["status"];
  time: string;
  active: boolean;
  onClick: () => void;
}) {
  const statusTextClass =
    status === "busy"
      ? "text-yellow-700"
      : status === "idle"
        ? "text-green-700"
        : "text-red-700"; // interrupted or error
  const statusDotClass =
    status === "busy"
      ? "bg-yellow-400"
      : status === "idle"
        ? "bg-green-500"
        : "bg-red-500";
  return (
    <button
      onClick={onClick}
      className={cn(
        "hover:bg-muted flex w-full max-w-full cursor-pointer items-start gap-2 overflow-hidden rounded-md border-none p-2 text-left transition-colors duration-200",
        active ? "bg-muted" : "bg-transparent",
      )}
      aria-current={active}
    >
      <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex w-full items-stretch justify-between gap-2 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-foreground mb-0.5 w-full max-w-full overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">
            {title}
          </div>
          <div className="text-muted-foreground mb-1 w-full max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {description}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end justify-between pl-2 text-[11px] text-muted-foreground">
          <span className={cn("flex items-center gap-1 capitalize", statusTextClass)}>
            <span className={cn("inline-block size-1.5 rounded-full", statusDotClass)} />
            {status.replaceAll("_", " ")}
          </span>
          <span className="tabular-nums">{time}</span>
        </div>
      </div>
    </button>
  );
}
