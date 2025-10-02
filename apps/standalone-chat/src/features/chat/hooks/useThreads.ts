import useSWRInfinite from "swr/infinite";
import type { Thread } from "@langchain/langgraph-sdk";
import { Client } from "@langchain/langgraph-sdk";
import { getConfig } from "@/lib/config";

export interface ThreadItem {
  id: string;
  updatedAt: Date;
  status: Thread["status"];
  title: string;
  description: string;
  assistantId?: string;
}

const DEFAULT_PAGE_SIZE = 20;

export function useThreads(props: {
  status?: Thread["status"];
  limit?: number;
}) {
  const pageSize = props.limit || DEFAULT_PAGE_SIZE;

  return useSWRInfinite(
    (pageIndex, previousPageData: ThreadItem[] | null) => {
      const config = getConfig();
      const apiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;

      if (!config || !apiKey) {
        return null;
      }

      // If the previous page returned no items, we've reached the end
      if (previousPageData && previousPageData.length === 0) {
        return null;
      }

      return {
        kind: "threads" as const,
        pageIndex,
        pageSize,
        deploymentUrl: config.deploymentUrl,
        assistantId: config.assistantId,
        apiKey,
        status: props?.status,
      };
    },
    async ({
      deploymentUrl,
      assistantId,
      apiKey,
      status,
      pageIndex,
      pageSize,
    }: {
      kind: "threads";
      pageIndex: number;
      pageSize: number;
      deploymentUrl: string;
      assistantId: string;
      apiKey: string;
      status?: Thread["status"];
    }) => {
      const client = new Client({
        apiUrl: deploymentUrl,
        defaultHeaders: {
          "X-Api-Key": apiKey,
        },
      });

      const threads = await client.threads.search({
        limit: pageSize,
        offset: pageIndex * pageSize,
        sortBy: "updated_at",
        sortOrder: "desc",
        status,
        metadata: { assistant_id: assistantId },
      });

      return threads.map((thread): ThreadItem => {
        // Extract title from thread metadata or first message
        let title = "Untitled Thread";
        let description = "";

        try {
          if (thread.values && typeof thread.values === "object") {
            const values = thread.values as any;

            if (values.messages && Array.isArray(values.messages)) {
              const firstHumanMessage = values.messages.find(
                (m: any) => m.type === "human"
              );
              if (firstHumanMessage?.content) {
                const content =
                  typeof firstHumanMessage.content === "string"
                    ? firstHumanMessage.content
                    : firstHumanMessage.content[0]?.text || "";
                title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
                description = content.slice(0, 100);
              }
            }
          }
        } catch {
          // Fallback to thread ID
          title = `Thread ${thread.thread_id.slice(0, 8)}`;
        }

        return {
          id: thread.thread_id,
          updatedAt: new Date(thread.updated_at),
          status: thread.status,
          title,
          description,
          assistantId,
        };
      });
    },
    {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    }
  );
}
