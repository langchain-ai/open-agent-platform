"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { createClient } from "@/lib/client";
import type { ChatHistoryItem } from "../types";
import { extractStringFromMessageContent } from "../utils";
import { Message } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { useAuthContext } from "@/providers/Auth";
import { cn } from "@/lib/utils";

interface ThreadHistorySidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export const ThreadHistorySidebar = React.memo<ThreadHistorySidebarProps>(
  ({ open, setOpen, currentThreadId, onThreadSelect }) => {
    const { session } = useAuthContext();
    const [threads, setThreads] = useState<ChatHistoryItem[]>([]);
    const [isLoadingThreadHistory, setIsLoadingThreadHistory] = useState(true);
    const [deploymentId] = useQueryState("deploymentId");

    const client = useMemo(() => {
      if (!deploymentId || !session?.accessToken) return null;
      return createClient(deploymentId, session.accessToken);
    }, [deploymentId, session]);

    const fetchThreads = useCallback(async () => {
      if (!client) return;
      setIsLoadingThreadHistory(true);
      try {
        const response = await client.threads.search({
          limit: 30,
          sortBy: "created_at",
          sortOrder: "desc",
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
              const messages = (thread.values as { messages?: unknown[] })
                .messages;
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
        setThreads(
          threadList.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          ),
        );
      } catch (error) {
        console.error("Failed to fetch threads:", error);
      } finally {
        setIsLoadingThreadHistory(false);
      }
    }, [client]);

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

    if (!open) return null;

    return (
      <>
        <style jsx>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>
        <div
          className="fixed top-0 right-0 z-50 h-screen"
          style={{
            width: "20vw",
            animation: "slideIn 300ms ease-out",
          }}
        >
          <div
            className="bg-background flex h-full flex-col border-l"
            style={{
              width: "100%",
              maxWidth: "100%",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-foreground m-0 text-base font-semibold">
                Thread History
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="hover:bg-muted p-1 transition-colors duration-200"
                >
                  <X size={20} />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
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
                          onClick={() => onThreadSelect(thread.id)}
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
                          onClick={() => onThreadSelect(thread.id)}
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
                          onClick={() => onThreadSelect(thread.id)}
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
                          onClick={() => onThreadSelect(thread.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </>
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
