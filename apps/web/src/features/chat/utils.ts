import { useAuthContext } from "@/providers/Auth";
import { createClient } from "@/lib/client";
import type { Agent } from "@/types/agent";
import type { Message } from "@langchain/langgraph-sdk";
import { useAgentsContext } from "@/providers/Agents";
import useSWR from "swr";
import { AgentSummary, ThreadItem } from "./types";

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

export function useThreads(args: {
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
      } else {
        params.metadata = {
          graph_id: "deep_agent",
        };
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
          let title = "";

          const isMessages = (
            values: unknown,
          ): values is { messages: Message[] } => {
            return (
              typeof values === "object" &&
              values !== null &&
              "messages" in values &&
              Array.isArray(values.messages)
            );
          };

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

export function useAgentSummaries(args: { deploymentId: string | null }) {
  const { agents } = useAgentsContext();
  const { session } = useAuthContext();

  return useSWR(
    { ...args, agents, session },
    async ({ deploymentId, agents, session }) => {
      if (!deploymentId || !session?.accessToken) return [];

      const client = createClient(deploymentId, session.accessToken);
      const summaries: AgentSummary[] = [];

      // Fetch latest thread for each agent
      for (const agent of agents) {
        if (agent.deploymentId !== args.deploymentId) continue;
        try {
          const interrupted = await client.threads.count({
            status: "interrupted",
            metadata: { assistant_id: agent.assistant_id },
          });

          const latest = await client.threads.search({
            limit: 1,
            sortBy: "updated_at",
            sortOrder: "desc",
            metadata: { assistant_id: agent.assistant_id },
          });

          let latestThread: ThreadItem | undefined;
          if (latest.length > 0) {
            const t = latest[0];
            let snippet = "";
            try {
              if (
                t.values &&
                typeof t.values === "object" &&
                "messages" in t.values
              ) {
                const messages = (t.values as { messages?: unknown[] })
                  .messages;
                if (Array.isArray(messages) && messages.length > 0) {
                  const last = messages[messages.length - 1] as Message;
                  snippet = truncateText(
                    extractStringFromMessageContent(last),
                    60,
                  );
                }
              }
            } catch (err) {
              console.warn(
                `Failed to get last message for thread ${t.thread_id}:`,
                err,
              );
            }

            latestThread = {
              id: t.thread_id,
              updatedAt: new Date(t.updated_at || t.created_at),
              status: t.status,
              title: agent.name || "Agent",
              description:
                snippet ||
                (agent.metadata?.description as string) ||
                "No description",
              assistantId: agent.assistant_id,
            };
          }

          summaries.push({
            agent,
            latestThread,
            interrupted:
              interrupted > 99
                ? "99+"
                : interrupted > 0
                  ? interrupted.toString()
                  : undefined,
          });
        } catch (error) {
          console.warn(
            `Failed to fetch threads for agent ${agent.name}:`,
            error,
          );
          summaries.push({
            agent,
            latestThread: undefined,
            interrupted: undefined,
          });
        }
      }

      // Sort by latest thread update time
      return summaries.sort((a, b) => {
        if (!a.latestThread && !b.latestThread) return 0;
        if (!a.latestThread) return 1;
        if (!b.latestThread) return -1;
        return (
          b.latestThread.updatedAt.getTime() -
          a.latestThread.updatedAt.getTime()
        );
      });
    },
  );
}
