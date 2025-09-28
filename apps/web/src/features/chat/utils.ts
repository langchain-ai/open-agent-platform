import { useAuthContext } from "@/providers/Auth";
import { createClient } from "@/lib/client";
import type { Agent } from "@/types/agent";
import type { Message, Thread } from "@langchain/langgraph-sdk";
import { useAgentsContext } from "@/providers/Agents";
import useSWR from "swr";
import { AgentSummary } from "./types";
import { useQueryState } from "nuqs";
import { format } from "date-fns";

export function getThreadColor(thread: {
  status: Thread["status"] | "draft";
}): string {
  switch (thread.status) {
    case "idle":
      return "bg-green-500";
    case "busy":
      return "bg-yellow-400";
    case "interrupted":
      return "bg-red-500";
    case "error":
      return "bg-red-600";
    case "draft":
    default:
      return "bg-gray-400";
  }
}

export const formatTime = (date: Date) => {
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

export const formatTimeElapsed = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days === 1) {
    return "1 day ago";
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return format(date, "MMM dd");
  }
};

export function extractStringFromMessageContent(message: Message): string {
  return typeof message.content === "string"
    ? message.content
    : Array.isArray(message.content)
      ? message.content
          .filter(
            (c: unknown) =>
              (typeof c === "object" &&
                c !== null &&
                "type" in c &&
                (c as { type: string }).type === "text") ||
              typeof c === "string",
          )
          .map((c: unknown) =>
            typeof c === "string"
              ? c
              : typeof c === "object" && c !== null && "text" in c
                ? (c as { text?: string }).text || ""
                : "",
          )
          .join("")
      : "";
}

export function truncateText(str: string, maxLength: number = 80): string {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}

const isMessages = (values: unknown): values is { messages: Message[] } => {
  return (
    typeof values === "object" &&
    values !== null &&
    "messages" in values &&
    Array.isArray(values.messages)
  );
};

export function useThreads() {
  const [selectedAgentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");
  const { session } = useAuthContext();
  const { agents } = useAgentsContext();

  return useSWR(
    {
      selectedAgentId,
      agents,
      accessToken: session?.accessToken,
      deploymentId,
    },
    async ({ deploymentId, selectedAgentId, agents, accessToken }) => {
      if (!deploymentId || !selectedAgentId || !accessToken) return [];
      const client = createClient(deploymentId, accessToken);

      // Build a quick lookup for agents in the current deployment
      const agentMap = new Map<string, Agent>(
        agents
          .filter((a) => a.deploymentId === deploymentId)
          .map((a) => [a.assistant_id, a]),
      );
      const agent = agentMap.get(selectedAgentId);
      if (!agent) return [];

      const response = await client.threads.search({
        // TODO: use useSWRInfinite to fetch multiple pages
        limit: 50,
        sortBy: "created_at",
        sortOrder: "desc",
        metadata: agent?.assistant_id
          ? { assistant_id: agent.assistant_id }
          : { graph_id: "deep_agent" },
      });

      const defaultTitle = agent?.name || "Agent";
      const defaultDesc =
        (agent?.metadata?.description as string | undefined) ||
        "No description";

      return response.map((t) => {
        // Try to derive a snippet from the last message in the thread
        let snippet = "";
        let title = "";

        try {
          if (isMessages(t.values)) {
            const lastMessage = t.values.messages.at(-1);
            const lastHuman = t.values.messages
              .filter((t) => t.type === "human")
              .at(-1);

            if (lastMessage != null) {
              snippet = truncateText(
                extractStringFromMessageContent(lastMessage),
                80,
              );
            }

            if (lastHuman != null) {
              title = truncateText(
                extractStringFromMessageContent(lastHuman),
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
          title: title || defaultTitle,
          description: snippet || defaultDesc,
          assistantId: agent?.assistant_id,
        };
      });
    },
  );
}

export function useAgentSummaries() {
  const { agents } = useAgentsContext();
  const { session } = useAuthContext();
  const [deploymentId] = useQueryState("deploymentId");

  return useSWR<
    AgentSummary[],
    any,
    { deploymentId: string; agents: Agent[]; accessToken: string } | null
  >(
    deploymentId != null && session?.accessToken != null
      ? { deploymentId, agents, accessToken: session?.accessToken }
      : null,
    {
      fallbackData: agents.map((agent) => ({
        agent,
        latestThread: undefined,
        interrupted: undefined,
      })),
      fetcher: async ({ deploymentId, agents, accessToken }) => {
        const client = createClient(deploymentId, accessToken);

        return (
          await Promise.all(
            agents.map(async (agent): Promise<AgentSummary | undefined> => {
              if (agent.deploymentId !== deploymentId) return undefined;

              let latestThread: AgentSummary["latestThread"] | undefined;
              let interrupted: string | undefined;

              try {
                const [interruptedData, [latestThreadData]] = await Promise.all(
                  [
                    client.threads.count({
                      status: "interrupted",
                      metadata: { assistant_id: agent.assistant_id },
                    }),
                    client.threads.search({
                      limit: 1,
                      sortBy: "updated_at",
                      sortOrder: "desc",
                      select: ["updated_at", "created_at", "status"],
                      metadata: { assistant_id: agent.assistant_id },
                    }),
                  ],
                );

                if (latestThreadData != null) {
                  const date =
                    latestThreadData.updated_at || latestThreadData.created_at;

                  latestThread = {
                    id: latestThreadData.thread_id,
                    updatedAt: new Date(date),
                    status: latestThreadData.status,
                  };
                }

                if (interruptedData > 99) {
                  interrupted = "99+";
                } else if (interruptedData > 0) {
                  interrupted = interruptedData.toString();
                } else {
                  interrupted = undefined;
                }
              } catch (error) {
                console.warn(
                  `Failed to fetch threads for agent ${agent.name}:`,
                  error,
                );
              }

              return { agent, latestThread, interrupted };
            }),
          )
        )
          .filter((s): s is AgentSummary => s !== undefined)
          .sort((a, b) => {
            if (!a.latestThread && !b.latestThread) return 0;
            if (!a.latestThread) return 1;
            if (!b.latestThread) return -1;
            return (
              b.latestThread.updatedAt.getTime() -
              a.latestThread.updatedAt.getTime()
            );
          });
      },
    },
  );
}
