"use client";

import React, { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2, MessageSquare } from "lucide-react";
import { useThreads } from "@/features/chat/hooks/useThreads";
import type { ThreadItem } from "@/features/chat/hooks/useThreads";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const GROUP_LABELS = {
  interrupted: "Requiring Attention",
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  older: "Older",
} as const;

function getThreadColor(status: ThreadItem["status"]): string {
  switch (status) {
    case "idle":
      return "bg-green-500";
    case "busy":
      return "bg-yellow-400";
    case "interrupted":
      return "bg-red-500";
    case "error":
      return "bg-red-600";
    default:
      return "bg-gray-400";
  }
}

function formatTime(input: Date, now = new Date()) {
  const date = input;
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
}

export function ThreadList({
  onThreadSelect,
  statusFilter = "all",
}: {
  onThreadSelect: (id: string) => void;
  statusFilter?: "all" | "idle" | "busy" | "interrupted" | "error";
}) {
  const [currentThreadId] = useQueryState("threadId");

  const threads = useThreads({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 20,
  });

  const flattened = useMemo(() => {
    return threads.data?.flat() ?? [];
  }, [threads.data]);

  const isLoadingMore =
    threads.size > 0 && threads.data?.[threads.size - 1] == null;
  const isEmpty = threads.data?.at(0)?.length === 0;
  const isReachingEnd = isEmpty || (threads.data?.at(-1)?.length ?? 0) < 20;

  const grouped = useMemo(() => {
    const now = new Date();
    const groups: Record<keyof typeof GROUP_LABELS, ThreadItem[]> = {
      interrupted: [],
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    flattened.forEach((thread) => {
      if (thread.status === "interrupted") {
        groups.interrupted.push(thread);
        return;
      }

      const diff = now.getTime() - thread.updatedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        groups.today.push(thread);
      } else if (days === 1) {
        groups.yesterday.push(thread);
      } else if (days < 7) {
        groups.week.push(thread);
      } else {
        groups.older.push(thread);
      }
    });

    return groups;
  }, [flattened]);

  if (threads.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-red-600">Failed to load threads</p>
        <p className="text-xs text-muted-foreground mt-1">
          {threads.error.message}
        </p>
      </div>
    );
  }

  if (!threads.data && threads.isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
        <p className="text-sm text-muted-foreground">No threads found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {(Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>).map(
          (group) => {
            const groupThreads = grouped[group];
            if (groupThreads.length === 0) return null;

            return (
              <div key={group}>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 px-2">
                  {GROUP_LABELS[group]}
                </h3>
                <div className="space-y-1">
                  {groupThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => onThreadSelect(thread.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors",
                        "hover:bg-gray-100",
                        currentThreadId === thread.id && "bg-gray-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                getThreadColor(thread.status)
                              )}
                            />
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {thread.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {thread.description}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(thread.updatedAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
        )}

        {!isReachingEnd && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => threads.setSize(threads.size + 1)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
