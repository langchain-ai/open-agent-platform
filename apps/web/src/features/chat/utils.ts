import { useAuthContext } from "@/providers/Auth";
import { createClient } from "@/lib/client";
import type { Agent } from "@/types/agent";
import type { Message, Thread } from "@langchain/langgraph-sdk";
import { useAgentsContext } from "@/providers/Agents";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { AgentSummary } from "./types";
import { useQueryState } from "nuqs";
import { format } from "date-fns";
import { useDeployment } from "@/lib/environment/deployments";

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

export const formatTime = (input: Date | string, now = new Date()) => {
  const date = typeof input === "string" ? new Date(input) : input;
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

export function useThreads(props: {
  status?: Thread["status"];
  limit: number;
}) {
  const [selectedAgentId] = useQueryState("agentId");
  const [deploymentId] = useDeployment();
  const { session } = useAuthContext();
  const { agents } = useAgentsContext();

  const pageSize = props.limit;

  return useSWRInfinite(
    (pageIndex, previousPageData: unknown[] | null) => {
      if (!deploymentId || !selectedAgentId || !session?.accessToken) {
        return null;
      }
      // If the previous page returned no items, we've reached the end
      if (
        previousPageData &&
        Array.isArray(previousPageData) &&
        previousPageData.length === 0
      ) {
        return null;
      }
      return {
        kind: "threads",
        pageIndex,
        pageSize,
        selectedAgentId,
        agents,
        accessToken: session.accessToken,
        deploymentId,
        status: props?.status,
      } as const;
    },
    async ({
      deploymentId,
      selectedAgentId,
      agents,
      accessToken,
      status,
      pageIndex,
      pageSize,
    }: {
      kind: "threads";
      pageIndex: number;
      pageSize: number;
      selectedAgentId: string | null;
      agents: Agent[];
      accessToken: string;
      deploymentId: string | null;
      status?: Thread["status"];
    }) => {
      if (!deploymentId || !selectedAgentId || !accessToken)
        return [] as Array<{
          id: string;
          updatedAt: Date;
          status: Thread["status"] | "draft";
          title: string;
          description: string;
          assistantId?: string;
        }>;

      const client = createClient(deploymentId, accessToken);

      const agent = agents.find(
        (a) =>
          a.deploymentId === deploymentId && a.assistant_id === selectedAgentId,
      );
      if (!agent) return [];

      const response = await client.threads.search({
        limit: pageSize,
        offset: pageIndex * pageSize,
        sortBy: "created_at",
        sortOrder: "desc",
        status,
        metadata: agent?.assistant_id
          ? { assistant_id: agent.assistant_id }
          : { graph_id: "deep_agent" },
      });

      const defaultTitle = agent?.name || "Agent";
      const defaultDesc =
        (agent?.metadata?.description as string | undefined) ||
        "No description";

      return response.map((t) => {
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
  const [deploymentId] = useDeployment();

  return useSWR<
    AgentSummary[],
    any,
    {
      kind: "agents";
      deploymentId: string;
      agents: Agent[];
      accessToken: string;
    } | null
  >(
    deploymentId != null && session?.accessToken != null
      ? {
          kind: "agents",
          deploymentId,
          agents,
          accessToken: session?.accessToken,
        }
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

export function useThread(threadId: string | null) {
  const { session } = useAuthContext();
  const [deploymentId] = useDeployment();
  const accessToken = session?.accessToken;
  const threadState = useSWR(
    threadId != null
      ? { kind: "thread", threadId, deploymentId, accessToken }
      : null,
    async ({ threadId, deploymentId, accessToken }) => {
      if (!deploymentId || !accessToken) return null;
      const client = createClient(deploymentId, accessToken);
      return [
        await client.threads.getState<{
          messages: Message[];
          todos: {
            id: string;
            content: string;
            status: "pending" | "in_progress" | "completed";
            updatedAt?: Date;
          }[];
          files: Record<string, string>;
        }>(threadId),
      ];
    },
  );

  return {
    data: threadState.data,
    isLoading: threadState.isLoading,
    error: threadState.error,
    mutate: () => threadState.mutate(),
  };
}
