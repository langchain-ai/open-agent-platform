"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { MessageSquare, X } from "lucide-react";
import { useClients } from "../providers/ClientProvider";
import type { Thread } from "../types";
import { extractStringFromMessageContent } from "../utils";
import { Message } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

interface ThreadHistorySidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onThreadSelect: (threadId: string) => void;
}

export const ThreadHistorySidebar = React.memo<ThreadHistorySidebarProps>(
  ({ open, setOpen, onThreadSelect }) => {
    const { client } = useClients();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoadingThreadHistory, setIsLoadingThreadHistory] = useState(true);
    const [currentThreadId] = useQueryState("threadId");

    const fetchThreads = useCallback(async () => {
      if (!client) return;
      setIsLoadingThreadHistory(true);
      try {
        const response = await client.threads.search({
          limit: 30,
          sortBy: "created_at",
          sortOrder: "desc",
        });
        const threadList: Thread[] = response.map(
          (thread: {
            thread_id: string;
            values?: unknown;
            created_at: string;
            updated_at?: string;
            status?: string;
          }) => {
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
            } as Thread;
          },
        );
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
      const groups: Record<string, Thread[]> = {
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
        <style>{`
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
            width: "350px",
            animation: "slideIn 300ms ease-out",
          }}
        >
          <div className="border-border bg-background flex h-full w-full max-w-full flex-col overflow-hidden border-l shadow-2xl">
            <div className="border-border bg-surface flex items-center justify-between border-b p-4">
              <h3 className="text-foreground m-0 text-base font-semibold">
                Thread History
              </h3>
              <div
                className="flex items-center"
                style={{ gap: "0.5rem" }}
              >
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
                <div className="text-tertiary flex flex-col items-center justify-center p-12 text-center">
                  Loading threads...
                </div>
              ) : threads.length === 0 ? (
                <div className="text-tertiary flex flex-col items-center justify-center p-12 text-center">
                  <MessageSquare
                    style={{
                      width: "32px",
                      height: "32px",
                      marginBottom: "0.5rem",
                      opacity: "0.5",
                    }}
                  />
                  <p>No threads yet</p>
                </div>
              ) : (
                <div
                  style={{
                    padding: "0.5rem",
                    width: "20vw",
                    maxWidth: "20vw",
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                >
                  {groupedThreads.today.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 className="font-semibold tracking-wider uppercase">
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
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 className="font-semibold tracking-wider uppercase">
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
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 className="font-semibold tracking-wider uppercase">
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
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 className="font-semibold tracking-wider uppercase">
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
  thread: Thread;
  isActive: boolean;
  onClick: () => void;
}>(({ thread, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full max-w-full cursor-pointer items-start gap-2 overflow-hidden rounded-md border-none p-2 text-left transition-colors duration-200",
        isActive ? "bg-accent" : "hover:bg-muted bg-transparent",
      )}
    >
      <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div
        style={{
          flex: "1",
          minWidth: "0",
          overflow: "hidden",
          width: "calc(20vw - 3rem)", // sidebar width minus padding and icon space
        }}
      >
        <div className="text-foreground mb-1 w-full max-w-full overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap">
          {thread.title}
        </div>
      </div>
    </button>
  );
});

ThreadItem.displayName = "ThreadItem";
ThreadHistorySidebar.displayName = "ThreadHistorySidebar";
