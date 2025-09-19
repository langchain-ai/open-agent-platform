"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, MessagesSquare } from "lucide-react";
import { createClient } from "@/lib/client";
import type { ChatHistoryItem } from "../types";
import { extractStringFromMessageContent } from "../utils";
import { Message } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { useAuthContext } from "@/providers/Auth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const fetchThreadsData = async (
  client: ReturnType<typeof createClient>,
  args?: {
    assistantId?: string;
  },
) => {
  if (!client) return [];

  const response = await client.threads.search({
    limit: 30,
    sortBy: "created_at",
    sortOrder: "desc",
    metadata: args?.assistantId
      ? {
          assistant_id: args?.assistantId,
        }
      : undefined,
  });

  const threadList: ChatHistoryItem[] = response.map((thread) => {
    let displayContent =
      thread.status === "busy"
        ? "Current Thread"
        : `Thread ${thread.thread_id.slice(0, 8)}`;
    try {
      if (
        thread.values &&
        typeof thread.values === "object" &&
        "messages" in thread.values
      ) {
        const messages = (thread.values as { messages?: unknown[] }).messages;
        if (
          Array.isArray(messages) &&
          messages.length > 0 &&
          thread.status !== "busy"
        ) {
          displayContent = extractStringFromMessageContent(
            messages[0] as Message,
          );
        }
      }
    } catch (error) {
      console.warn(
        `Failed to get first message for thread ${thread.thread_id}:`,
        error,
      );
    }
    return {
      id: thread.thread_id,
      title: displayContent,
      createdAt: new Date(thread.created_at),
      updatedAt: new Date(thread.updated_at || thread.created_at),
    };
  });

  return threadList.sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
};

interface ThreadHistorySidebarProps {
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export const ThreadHistorySidebar = React.memo<ThreadHistorySidebarProps>(
  ({ currentThreadId, onThreadSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { session } = useAuthContext();
    const [threads, setThreads] = useState<ChatHistoryItem[]>([]);
    const [isLoadingThreadHistory, setIsLoadingThreadHistory] = useState(true);
    const [agentId] = useQueryState("agentId");
    const [deploymentId] = useQueryState("deploymentId");

    const client = useMemo(() => {
      if (!deploymentId || !session?.accessToken) return null;
      return createClient(deploymentId, session.accessToken);
    }, [deploymentId, session]);

    const fetchThreads = useCallback(async () => {
      if (!client || !agentId) return;
      setIsLoadingThreadHistory(true);
      try {
        const threadList = await fetchThreadsData(client, {
          assistantId: agentId,
        });
        setThreads(threadList);
      } catch (error) {
        console.error("Failed to fetch threads:", error);
      } finally {
        setIsLoadingThreadHistory(false);
      }
    }, [client, agentId]);

    useEffect(() => {
      fetchThreads();
    }, [fetchThreads, currentThreadId]);

    const groupedThreads = useMemo(() => {
      const groups: Record<string, ChatHistoryItem[]> = {
        today: [],
        yesterday: [],
        week: [],
        older: [],
      };
      const now = new Date();
      threads.forEach((thread) => {
        const diff = now.getTime() - thread.updatedAt.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) groups.today.push(thread);
        else if (days === 1) groups.yesterday.push(thread);
        else if (days < 7) groups.week.push(thread);
        else groups.older.push(thread);
      });
      return groups;
    }, [threads]);

    return (
      <Sheet
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shadow-icon-button size-6 rounded border border-[#E4E4E7] bg-white p-2"
            onClick={() => setIsOpen(true)}
          >
            <MessagesSquare className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[20vw] p-0"
        >
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-base font-semibold">
              Thread History
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)] flex-1 overflow-y-auto">
            {isLoadingThreadHistory ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center">
                Loading threads...
              </div>
            ) : threads.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center p-12 text-center">
                <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
                <p>No threads yet</p>
              </div>
            ) : (
              <div className="box-border w-full max-w-full overflow-hidden p-2">
                {groupedThreads.today.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold tracking-wide uppercase">
                      Today
                    </h4>
                    {groupedThreads.today.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => {
                          onThreadSelect(thread.id);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
                {groupedThreads.yesterday.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold tracking-wide uppercase">
                      Yesterday
                    </h4>
                    {groupedThreads.yesterday.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => {
                          onThreadSelect(thread.id);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
                {groupedThreads.week.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold tracking-wide uppercase">
                      This Week
                    </h4>
                    {groupedThreads.week.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => {
                          onThreadSelect(thread.id);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
                {groupedThreads.older.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-muted-foreground m-0 p-2 text-xs font-semibold tracking-wide uppercase">
                      Older
                    </h4>
                    {groupedThreads.older.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => {
                          onThreadSelect(thread.id);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  },
);

const ThreadItem = React.memo<{
  thread: ChatHistoryItem;
  isActive: boolean;
  onClick: () => void;
}>(({ thread, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "hover:bg-muted flex w-full max-w-full cursor-pointer items-start gap-2 overflow-hidden rounded-md border-none p-2 text-left transition-colors duration-200",
        isActive ? "bg-muted" : "bg-transparent",
      )}
    >
      <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="w-[calc(20vw-3rem)] min-w-0 flex-1 overflow-hidden">
        <div className="text-foreground mb-1 w-full max-w-full overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap">
          {thread.title}
        </div>
      </div>
    </button>
  );
});

ThreadItem.displayName = "ThreadItem";
ThreadHistorySidebar.displayName = "ThreadHistorySidebar";
