"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { createClient } from "@/lib/client";
import type { Thread } from "../types";
import { extractStringFromMessageContent } from "../utils";
import { Message } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import { useAuthContext } from "@/providers/Auth";

interface ThreadHistorySidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export const ThreadHistorySidebar = React.memo<ThreadHistorySidebarProps>(
  ({ open, setOpen, currentThreadId, onThreadSelect }) => {
    const { session } = useAuthContext();
    const [threads, setThreads] = useState<Thread[]>([]);
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
            className="flex h-full flex-col border-l"
            style={{
              width: "100%",
              maxWidth: "100%",
              borderLeftColor: "var(--color-border)",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
          >
            <div
              className="flex items-center justify-between border-b"
              style={{
                padding: "1rem",
                borderBottomColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <h3
                className="text-base font-semibold"
                style={{
                  margin: "0",
                  color: "var(--color-text-primary)",
                }}
              >
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
                  className="transition-colors duration-200"
                  style={{ padding: "0.25rem" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-border-light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X size={20} />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 overflow-y-auto">
              {isLoadingThreadHistory ? (
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{
                    padding: "3rem",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  Loading threads...
                </div>
              ) : threads.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{
                    padding: "3rem",
                    color: "var(--color-text-tertiary)",
                  }}
                >
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
                      <h4
                        className="font-semibold tracking-wider uppercase"
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                          letterSpacing: "0.05em",
                          padding: "0.5rem",
                          margin: "0",
                        }}
                      >
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
                      <h4
                        className="font-semibold tracking-wider uppercase"
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                          letterSpacing: "0.05em",
                          padding: "0.5rem",
                          margin: "0",
                        }}
                      >
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
                      <h4
                        className="font-semibold tracking-wider uppercase"
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                          letterSpacing: "0.05em",
                          padding: "0.5rem",
                          margin: "0",
                        }}
                      >
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
                      <h4
                        className="font-semibold tracking-wider uppercase"
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                          letterSpacing: "0.05em",
                          padding: "0.5rem",
                          margin: "0",
                        }}
                      >
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
      className="flex cursor-pointer items-start rounded-md border-none text-left transition-colors duration-200"
      style={{
        width: "100%",
        maxWidth: "100%",
        gap: "0.5rem",
        padding: "0.5rem",
        backgroundColor: isActive ? "var(--color-avatar-bg)" : "transparent",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "var(--color-border-light)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      <MessageSquare
        className="shrink-0"
        style={{
          width: "16px",
          height: "16px",
          color: "var(--color-text-secondary)",
          marginTop: "2px",
        }}
      />
      <div
        style={{
          flex: "1",
          minWidth: "0",
          overflow: "hidden",
          width: "calc(20vw - 3rem)", // sidebar width minus padding and icon space
        }}
      >
        <div
          className="font-medium"
          style={{
            fontSize: "12px",
            color: "var(--color-text-primary)",
            marginBottom: "0.25rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {thread.title}
        </div>
      </div>
    </button>
  );
});

ThreadItem.displayName = "ThreadItem";
ThreadHistorySidebar.displayName = "ThreadHistorySidebar";
