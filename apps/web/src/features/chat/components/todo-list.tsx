"use client";

import React, { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertCircle, Clock, MessageSquare, User } from "lucide-react";
import { useAuthContext } from "@/providers/Auth";
import { createClient } from "@/lib/client";
import type { Agent } from "@/types/agent";
import type { Thread, Message } from "@langchain/langgraph-sdk";
import { format } from "date-fns";
import { useAgentsContext } from "@/providers/Agents";
import useSWR from "swr";
import { extractStringFromMessageContent, truncateText } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  deploymentId: string | null;
  onThreadSelect: (id: string, assistantId?: string) => void;
};

type TodoItem = {
  id: string;
  updatedAt: Date;
  status: Thread["status"] | "human_response_needed";
  title: string;
  description: string;
  assistantId?: string;
  agentName?: string;
};

function useAttentionThreads(args: { deploymentId: string | null }) {
  const { session } = useAuthContext();
  const { agents } = useAgentsContext();

  return useSWR(
    { kind: "attention", ...args, agents, session },
    async ({ deploymentId, agents, session }) => {
      if (!deploymentId || !session?.accessToken) return [];

      // Build a quick lookup for agents in the current deployment
      const agentsByAssistantId = new Map<string, Agent>(
        agents
          .filter((a) => a.deploymentId === args.deploymentId)
          .map((a) => [a.assistant_id, a]),
      );

      const client = createClient(deploymentId, session.accessToken);
      const params: Parameters<typeof client.threads.search>[0] = {
        limit: 50,
        sortBy: "created_at",
        sortOrder: "desc",
        metadata: {
          graph_id: "deep_agent",
        },
      };

      const response = await client.threads.search(params);

      return response
        .filter((t) => {
          // Filter for threads that require attention
          return t.status === "interrupted" || t.status === "error";
        })
        .map((t) => {
          const meta = (t as unknown as { metadata?: Record<string, unknown> })
            .metadata;
          const assistantId =
            (meta?.["assistant_id"] as string | undefined) || undefined;
          const matched = assistantId
            ? agentsByAssistantId.get(assistantId)
            : undefined;

          // Try to derive a snippet from the last message in the thread
          let snippet = "";
          try {
            if (
              t.values &&
              typeof t.values === "object" &&
              "messages" in t.values
            ) {
              const messages = (t.values as { messages?: unknown[] }).messages;
              if (Array.isArray(messages) && messages.length > 0) {
                const last = messages[messages.length - 1] as Message;
                snippet = truncateText(
                  extractStringFromMessageContent(last),
                  100,
                );
              }
            }
          } catch (err) {
            console.warn(
              `Failed to get last message for thread ${t.thread_id}:`,
              err,
            );
          }

          return {
            id: t.thread_id,
            updatedAt: new Date(t.updated_at || t.created_at),
            status: t.status,
            title: matched?.name || "Agent",
            description:
              snippet ||
              (matched?.metadata?.description as string | undefined) ||
              "No description",
            assistantId,
            agentName: matched?.name || "Unknown Agent",
          };
        });
    },
  );
}

export function TodoList({ deploymentId, onThreadSelect }: Props) {
  const threads = useAttentionThreads({ deploymentId });

  const grouped = useMemo(() => {
    const groups: Record<string, TodoItem[]> = {
      urgent: [],
      recent: [],
      older: [],
    };

    const now = new Date();
    const items = threads.data ?? [];

    items.forEach((t) => {
      const diff = now.getTime() - t.updatedAt.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (t.status === "error" || t.status === "interrupted") {
        groups.urgent.push(t);
      } else if (hours < 24) {
        groups.recent.push(t);
      } else {
        groups.older.push(t);
      }
    });

    return groups;
  }, [threads.data]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "interrupted":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "human_response_needed":
        return <User className="h-4 w-4 text-blue-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "error":
        return (
          <Badge
            variant="destructive"
            className="text-xs"
          >
            Error
          </Badge>
        );
      case "interrupted":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-xs text-orange-800"
          >
            Interrupted
          </Badge>
        );
      case "human_response_needed":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-xs text-blue-800"
          >
            Response Needed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (status: string) => {
    switch (status) {
      case "error":
        return "border-l-red-500";
      case "interrupted":
        return "border-l-orange-500";
      case "human_response_needed":
        return "border-l-blue-500";
      default:
        return "border-l-gray-300";
    }
  };

  if (threads.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center p-12">
        Loading threads requiring attention...
      </div>
    );
  }

  if (!threads.data?.length) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center">
        <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No threads require attention</p>
        <p className="mt-1 text-xs">All conversations are up to date</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Threads Requiring Attention</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {threads.data.length} conversation
          {threads.data.length !== 1 ? "s" : ""} need
          {threads.data.length === 1 ? "s" : ""} your attention
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {grouped.urgent.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
                <AlertCircle className="h-4 w-4" />
                Urgent ({grouped.urgent.length})
              </h3>
              <div className="space-y-2">
                {grouped.urgent.map((t) => (
                  <TodoItem
                    key={t.id}
                    item={t}
                    onThreadSelect={onThreadSelect}
                    getStatusIcon={getStatusIcon}
                    getStatusBadge={getStatusBadge}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            </div>
          )}

          {grouped.recent.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                <Clock className="h-4 w-4" />
                Recent ({grouped.recent.length})
              </h3>
              <div className="space-y-2">
                {grouped.recent.map((t) => (
                  <TodoItem
                    key={t.id}
                    item={t}
                    onThreadSelect={onThreadSelect}
                    getStatusIcon={getStatusIcon}
                    getStatusBadge={getStatusBadge}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            </div>
          )}

          {grouped.older.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <MessageSquare className="h-4 w-4" />
                Older ({grouped.older.length})
              </h3>
              <div className="space-y-2">
                {grouped.older.map((t) => (
                  <TodoItem
                    key={t.id}
                    item={t}
                    onThreadSelect={onThreadSelect}
                    getStatusIcon={getStatusIcon}
                    getStatusBadge={getStatusBadge}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TodoItem({
  item,
  onThreadSelect,
  getStatusIcon,
  getStatusBadge,
  getPriorityColor,
}: {
  item: TodoItem;
  onThreadSelect: (id: string, assistantId?: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
  getPriorityColor: (status: string) => string;
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "h-auto w-full justify-start border-l-4 p-3",
        getPriorityColor(item.status),
        "hover:bg-gray-50",
      )}
      onClick={() => onThreadSelect(item.id, item.assistantId)}
    >
      <div className="flex w-full items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{getStatusIcon(item.status)}</div>

        <div className="min-w-0 flex-1 text-left">
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {item.agentName}
            </span>
            {getStatusBadge(item.status)}
          </div>

          <p className="mb-2 line-clamp-2 text-xs text-gray-600">
            {item.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {format(item.updatedAt, "MMM d, h:mm a")}
            </span>
            <span className="text-xs text-gray-400">Click to open</span>
          </div>
        </div>
      </div>
    </Button>
  );
}
