"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { useAuthContext } from "@/providers/Auth";
import { createClient } from "@/lib/client";
import type { Agent } from "@/types/agent";
import type { Thread } from "@langchain/langgraph-sdk";
import { format } from "date-fns";
import { useAgentsContext } from "@/providers/Agents";

type Props = {
  agent: Agent | null;
  deploymentId: string | null;
  currentThreadId: string | null;
  onThreadSelect: (id: string, assistantId?: string) => void;
  showDraft?: boolean;
  className?: string;
  statusFilter?: "all" | "idle" | "busy" | "interrupted" | "error";
};

type Item = {
  id: string;
  updatedAt: Date;
  status: Thread["status"] | "draft";
  title: string;
  description: string;
  assistantId?: string;
};

export function ThreadHistoryAgentList({
  agent,
  deploymentId,
  currentThreadId,
  onThreadSelect,
  showDraft = false,
  className,
  statusFilter = "all",
}: Props) {
  const { session } = useAuthContext();
  const { agents: allAgents } = useAgentsContext();
  const client = useMemo(() => {
    if (!deploymentId || !session?.accessToken) return null;
    return createClient(deploymentId, session.accessToken);
  }, [deploymentId, session]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);

  // Build a quick lookup for agents in the current deployment
  const agentsByAssistantId = useMemo(() => {
    const map = new Map<string, Agent>();
    allAgents
      .filter((a) => a.deploymentId === deploymentId)
      .forEach((a) => map.set(a.assistant_id, a));
    return map;
  }, [allAgents, deploymentId]);

  const fetchThreads = useCallback(async () => {
    if (!client) return;
    // Avoid flicker: only show loading spinner when list is empty
    setLoading((prev) => (items.length === 0 ? true : prev));
    try {
      const params: Parameters<typeof client.threads.search>[0] = {
        limit: 50,
        sortBy: "created_at",
        sortOrder: "desc",
      };
      if (agent?.assistant_id) {
        params.metadata = { assistant_id: agent.assistant_id } as Record<
          string,
          string
        >;
      }
      const response = await client.threads.search(params);
      const defaultTitle = agent?.name || "Agent";
      const defaultDesc =
        (agent?.metadata?.description as string | undefined) ||
        "No description";

      const mapped: Item[] = response.map((t) => {
        // If a specific agent is selected, use it for title/desc
        if (agent?.assistant_id) {
          return {
            id: t.thread_id,
            updatedAt: new Date(t.updated_at || t.created_at),
            status: t.status,
            title: defaultTitle,
            description: defaultDesc,
            assistantId: agent.assistant_id,
          };
        }

        // Otherwise, try to derive the agent from thread metadata
        const meta = (t as unknown as { metadata?: Record<string, unknown> })
          .metadata;
        const assistantId =
          (meta?.["assistant_id"] as string | undefined) || undefined;
        const matched = assistantId
          ? agentsByAssistantId.get(assistantId)
          : undefined;

        return {
          id: t.thread_id,
          updatedAt: new Date(t.updated_at || t.created_at),
          status: t.status,
          title: matched?.name || defaultTitle,
          description:
            (matched?.metadata?.description as string | undefined) ||
            defaultDesc,
          assistantId,
        };
      });
      setItems(
        mapped.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
      );
    } finally {
      setLoading(false);
    }
  }, [
    client,
    agent?.assistant_id,
    agent?.name,
    agent?.metadata,
    deploymentId,
    agentsByAssistantId,
    items.length,
  ]);

  // Initial fetch on mount or when client/agent changes
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Refetch after a concrete thread is selected/created to include it,
  // but avoid refetch on "new thread" state (threadId === null) to prevent flicker.
  useEffect(() => {
    if (currentThreadId) {
      fetchThreads();
    }
  }, [fetchThreads, currentThreadId]);

  const displayItems = useMemo(() => {
    if (showDraft && !currentThreadId && agent) {
      const draft: Item = {
        id: "__draft__",
        updatedAt: new Date(),
        status: "draft",
        title: agent.name || "Agent",
        description:
          (agent.metadata?.description as string | undefined) ||
          "No description",
      };
      return [draft, ...items];
    }
    return items;
  }, [showDraft, currentThreadId, agent, items]);

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
                    title={t.title}
                    description={t.description}
                    status={t.status}
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
            )}
            {grouped.yesterday.length > 0 && (
              <Group label="Yesterday">
                {grouped.yesterday.map((t) => (
                  <Row
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    description={t.description}
                    status={t.status}
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
            )}
            {grouped.week.length > 0 && (
              <Group label="This Week">
                {grouped.week.map((t) => (
                  <Row
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    description={t.description}
                    status={t.status}
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
            )}
            {grouped.older.length > 0 && (
              <Group label="Older">
                {grouped.older.map((t) => (
                  <Row
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    description={t.description}
                    status={t.status}
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
            )}
          </div>
        )}
      </ScrollArea>
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
    <div className="mb-6">
      <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold tracking-wide uppercase">
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
  const statusTextClass =
    status === "draft"
      ? "text-gray-600"
      : status === "busy"
        ? "text-yellow-700"
        : status === "idle"
          ? "text-green-700"
          : "text-red-700"; // interrupted or error
  const statusDotClass =
    status === "draft"
      ? "bg-gray-400"
      : status === "busy"
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
      <div className="flex w-full min-w-0 items-stretch justify-between gap-2 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-foreground mb-0.5 w-full max-w-full overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">
            {title}
          </div>
          <div className="text-muted-foreground mb-1 w-full max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {description}
          </div>
        </div>
        <div className="text-muted-foreground flex shrink-0 flex-col items-end justify-between pl-2 text-[11px]">
          <span
            className={cn(
              "flex items-center gap-1 capitalize",
              statusTextClass,
            )}
          >
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                statusDotClass,
              )}
            />
            {status.replaceAll("_", " ")}
          </span>
          <span className="tabular-nums">{time}</span>
        </div>
      </div>
    </button>
  );
}
