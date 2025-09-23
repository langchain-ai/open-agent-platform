"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { useAuthContext } from "@/providers/Auth";
import { useQueryState } from "nuqs";
import { createClient } from "@/lib/client";
import type { Message } from "@langchain/langgraph-sdk";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { extractStringFromMessageContent } from "@/features/chat/utils";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { getDeployments } from "@/lib/environment/deployments";

type ChatHistoryItem = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

async function fetchThreadsData(
  client: ReturnType<typeof createClient>,
  args?: { assistantId?: string },
): Promise<ChatHistoryItem[]> {
  if (!client) return [];
  const response = await client.threads.search({
    limit: 50,
    sortBy: "created_at",
    sortOrder: "desc",
    metadata: args?.assistantId ? { assistant_id: args.assistantId } : undefined,
  });

  const threadList: ChatHistoryItem[] = response.map((thread) => {
    let displayContent =
      thread.status === "busy"
        ? "Current Thread"
        : `Thread ${thread.thread_id.slice(0, 8)}`;
    try {
      if (thread.values && typeof thread.values === "object" && "messages" in thread.values) {
        const messages = (thread.values as { messages?: unknown[] }).messages;
        if (Array.isArray(messages) && messages.length > 0 && thread.status !== "busy") {
          displayContent = extractStringFromMessageContent(messages[0] as Message);
        }
      }
    } catch (err) {
      console.warn(`Failed to read first message for thread ${thread.thread_id}:`, err);
    }
    return {
      id: thread.thread_id,
      title: displayContent,
      createdAt: new Date(thread.created_at),
      updatedAt: new Date(thread.updated_at || thread.created_at),
    };
  });

  return threadList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

function ThreadHistoryHalf(): React.ReactNode {
  const { session } = useAuthContext();
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");
  const [currentThreadId, setCurrentThreadId] = useQueryState("threadId");

  const client = useMemo(() => {
    if (!deploymentId || !session?.accessToken) return null;
    return createClient(deploymentId, session.accessToken);
  }, [deploymentId, session]);

  const [threads, setThreads] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!client || !agentId) return;
    setLoading(true);
    try {
      const data = await fetchThreadsData(client, { assistantId: agentId });
      setThreads(data);
    } finally {
      setLoading(false);
    }
  }, [client, agentId]);

  useEffect(() => {
    refresh();
  }, [refresh, currentThreadId]);

  const grouped = useMemo(() => {
    const groups: Record<string, ChatHistoryItem[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };
    const now = new Date();
    threads.forEach((t) => {
      const diff = now.getTime() - t.updatedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) groups.today.push(t);
      else if (days === 1) groups.yesterday.push(t);
      else if (days < 7) groups.week.push(t);
      else groups.older.push(t);
    });
    return groups;
  }, [threads]);

  return (
    <div className="flex h-full w-full">
      <div className="w-1/2 border-r border-gray-200">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Thread History</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-100px)]">
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center p-12">
              Loading threads...
            </div>
          ) : threads.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center">
              <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
              <p>No threads yet</p>
            </div>
          ) : (
            <div className="box-border w-full max-w-full overflow-hidden p-2">
              {grouped.today.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold uppercase tracking-wide">
                    Today
                  </h4>
                  {grouped.today.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      isActive={thread.id === currentThreadId}
                      onClick={() => setCurrentThreadId(thread.id)}
                    />
                  ))}
                </div>
              )}
              {grouped.yesterday.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold uppercase tracking-wide">
                    Yesterday
                  </h4>
                  {grouped.yesterday.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      isActive={thread.id === currentThreadId}
                      onClick={() => setCurrentThreadId(thread.id)}
                    />
                  ))}
                </div>
              )}
              {grouped.week.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold uppercase tracking-wide">
                    This Week
                  </h4>
                  {grouped.week.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      isActive={thread.id === currentThreadId}
                      onClick={() => setCurrentThreadId(thread.id)}
                    />
                  ))}
                </div>
              )}
              {grouped.older.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold uppercase tracking-wide">
                    Older
                  </h4>
                  {grouped.older.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      isActive={thread.id === currentThreadId}
                      onClick={() => setCurrentThreadId(thread.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="w-1/2">
        <RightPaneChat />
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  isActive,
  onClick,
}: {
  thread: ChatHistoryItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "hover:bg-muted flex w-full max-w-full cursor-pointer items-start gap-2 overflow-hidden rounded-md border-none p-2 text-left transition-colors duration-200",
        isActive ? "bg-muted" : "bg-transparent",
      )}
    >
      <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="w-[calc(50vw-5rem)] min-w-0 flex-1 overflow-hidden">
        <div className="text-foreground mb-1 w-full max-w-full overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap">
          {thread.title}
        </div>
      </div>
    </button>
  );
}

export default function AgentsChatHalf(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading…</div>}>
      <div className="flex h-screen flex-col">
        <AgentsProvider>
          <MCPProvider>
            <ThreadHistoryHalf />
          </MCPProvider>
        </AgentsProvider>
      </div>
    </React.Suspense>
  );
}

function RightPaneChat(): React.ReactNode {
  const { session } = useAuthContext();
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");

  const deployments = getDeployments();
  const selectedDeployment = useMemo(
    () => deployments.find((d) => d.id === deploymentId),
    [deployments, deploymentId],
  );

  if (!agentId || !deploymentId || !session?.accessToken) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Select an agent and a thread to view chat
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <DeepAgentChatInterface
        assistantId={agentId}
        deploymentUrl={selectedDeployment?.deploymentUrl || ""}
        accessToken={session.accessToken || ""}
        optimizerDeploymentUrl={
          process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || ""
        }
        optimizerAccessToken={session.accessToken || ""}
        mode="oap"
        hideInternalToggle={true}
        hideSidebar={true}
        view="chat"
      />
    </div>
  );
}
