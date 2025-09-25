"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { useAuthContext } from "@/providers/Auth";
import { createClient } from "@/lib/client";
import type { Agent } from "@/types/agent";
import type { Thread, Message } from "@langchain/langgraph-sdk";
import { format } from "date-fns";
import { useAgentsContext } from "@/providers/Agents";
import useSWR from "swr";
import { extractStringFromMessageContent, truncateText } from "../utils";
import { useTriggers } from "@/hooks/use-triggers";
import type { Trigger, ListTriggerRegistrationsData } from "@/types/triggers";

type Props = {
  agent: Agent | null;
  deploymentId: string | null;
  currentThreadId: string | null;
  onThreadSelect: (id: string, assistantId?: string) => void;
  showDraft?: boolean;
  className?: string;
  statusFilter?: "all" | "idle" | "busy" | "interrupted" | "error";
};

type ThreadItem = {
  id: string;
  updatedAt: Date;
  status: Thread["status"] | "draft";
  title: string;
  description: string;
  assistantId?: string;
  triggerNames?: string[];
};

function useThreads(args: {
  deploymentId: string | null;
  agent: Agent | null;
}) {
  const { session } = useAuthContext();
  const { agents } = useAgentsContext();

  return useSWR(
    { ...args, agents, session },
    async ({ deploymentId, agent, agents, session }) => {
      if (!deploymentId || !session?.accessToken) return [];

      // Build a quick lookup for agents in the current deployment
      const agentsByAssistantId = new Map<string, Agent>(
        agents
          .filter((a) => a.deploymentId === args.deploymentId)
          .map((a) => [a.assistant_id, a]),
      );

      const client = createClient(deploymentId, session.accessToken);
      const params: Parameters<typeof client.threads.search>[0] = {
        // TODO: use useSWRInfinite to fetch multiple pages
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

      return response.map((t) => {
        // If a specific agent is selected, use it for title/desc
        if (agent?.assistant_id) {
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
                  80,
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
            title: defaultTitle,
            description: snippet || defaultDesc,
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
              snippet = truncateText(extractStringFromMessageContent(last), 80);
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
          title: matched?.name || defaultTitle,
          description:
            snippet ||
            (matched?.metadata?.description as string | undefined) ||
            defaultDesc,
          assistantId,
        };
      });
    },
  );
}

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
  const { agents } = useAgentsContext();
  const { listTriggers, listUserTriggers, listAgentTriggers } = useTriggers();

  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [registrations, setRegistrations] = useState<
    ListTriggerRegistrationsData[]
  >([]);
  const [agentTriggers, setAgentTriggers] = useState<Record<string, string[]>>(
    {},
  );

  // Function to get trigger names for an agent - memoized to prevent infinite loops
  const getTriggerNamesForAgent = useMemo(
    () =>
      (agentId: string): string[] => {
        const triggerIds = agentTriggers[agentId] || [];
        const triggerNames: string[] = [];

        triggerIds.forEach((registrationId) => {
          const registration = registrations.find(
            (r) => r.id === registrationId,
          );
          if (registration) {
            const trigger = triggers.find(
              (t) => t.id === registration.template_id,
            );
            if (trigger) {
              triggerNames.push(trigger.displayName);
            }
          }
        });

        return triggerNames;
      },
    [agentTriggers, registrations, triggers],
  );

  const threads = useThreads({ deploymentId, agent });

  // Load triggers data for displaying trigger names
  useEffect(() => {
    const loadTriggersData = async () => {
      if (!session?.accessToken || agents.length === 0) return;

      try {
        const [triggersData, registrationsData] = await Promise.all([
          listTriggers(session.accessToken),
          listUserTriggers(session.accessToken),
        ]);

        if (triggersData) setTriggers(triggersData);
        if (registrationsData) setRegistrations(registrationsData);

        // Fetch agent triggers for all agents
        const agentTriggersMap: Record<string, string[]> = {};
        await Promise.all(
          agents.map(async (agentItem) => {
            const agentTriggerIds = await listAgentTriggers(
              session.accessToken,
              agentItem.assistant_id,
            );
            agentTriggersMap[agentItem.assistant_id] = agentTriggerIds;
          }),
        );
        setAgentTriggers(agentTriggersMap);
      } catch (error) {
        console.error("Failed to load triggers data:", error);
      }
    };

    loadTriggersData();
  }, [session?.accessToken, agents.length]);

  const displayItems = useMemo(() => {
    const baseItems = threads.data ?? [];

    // Add trigger names to each thread item
    const itemsWithTriggers: ThreadItem[] = baseItems.map((item) => ({
      ...item,
      triggerNames: item.assistantId
        ? getTriggerNamesForAgent(item.assistantId)
        : [],
    }));

    if (showDraft && !currentThreadId && agent) {
      const draft: ThreadItem = {
        id: "__draft__",
        updatedAt: new Date(),
        status: "draft",
        title: agent.name || "Agent",
        description:
          (agent.metadata?.description as string | undefined) ||
          "No description",
        assistantId: agent.assistant_id,
        triggerNames: getTriggerNamesForAgent(agent.assistant_id),
      };
      return [draft, ...itemsWithTriggers];
    }
    return itemsWithTriggers;
  }, [
    showDraft,
    currentThreadId,
    agent,
    threads.data,
    getTriggerNamesForAgent,
  ]);

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
      <ScrollArea className="h-[calc(100vh-100px)]">
        {threads.isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center p-12">
            Loading threads...
          </div>
        ) : !threads.data?.length ? (
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
                    triggerNames={t.triggerNames}
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
                    triggerNames={t.triggerNames}
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
                    triggerNames={t.triggerNames}
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
                    triggerNames={t.triggerNames}
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
    <div className="mb-6 flex flex-col gap-1">
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
  triggerNames,
}: {
  id: string;
  title: string;
  description: string;
  status: Thread["status"] | "draft";
  time: string;
  active: boolean;
  onClick: () => void;
  triggerNames?: string[];
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
        "hover:bg-muted grid cursor-pointer grid-cols-[auto_1fr] gap-2 overflow-hidden rounded-md border-none p-2 text-left transition-colors duration-200",
        active ? "bg-muted" : "bg-transparent",
      )}
      aria-current={active}
    >
      <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex w-full min-w-0 flex-shrink-0 items-stretch justify-between gap-2 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-0.5 flex w-full max-w-full items-center gap-2 overflow-hidden">
            <div className="text-foreground flex-shrink-0 overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">
              {title}
            </div>
            {triggerNames && triggerNames.length > 0 && (
              <div className="flex flex-shrink flex-wrap gap-1">
                {triggerNames.map((triggerName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-blue-800"
                  >
                    {triggerName}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="text-muted-foreground mb-1 w-full max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap">
            {description}
          </div>
        </div>
        <div className="text-muted-foreground flex shrink-0 flex-col items-end pl-2 text-xs">
          <span
            className={cn(
              "mb-0.5 flex h-5 items-center gap-1 capitalize",
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
