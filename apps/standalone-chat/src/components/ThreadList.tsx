"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useThreads } from "@/features/chat/hooks/useThreads";
import type { ThreadItem } from "@/features/chat/hooks/useThreads";

type StatusFilter = "all" | "idle" | "busy" | "interrupted" | "error";

const GROUP_LABELS = {
  interrupted: "Requiring Attention",
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  older: "Older",
} as const;

const STATUS_COLORS: Record<ThreadItem["status"], string> = {
  idle: "bg-green-500",
  busy: "bg-yellow-400",
  interrupted: "bg-red-500",
  error: "bg-red-600",
};

function getThreadColor(status: ThreadItem["status"]): string {
  return STATUS_COLORS[status] ?? "bg-gray-400";
}

function formatTime(date: Date, now = new Date()): string {
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return format(date, "HH:mm");
  if (days === 1) return "Yesterday";
  if (days < 7) return format(date, "EEEE");
  return format(date, "MM/dd");
}

function StatusFilterItem({
  status,
  label,
  badge,
}: {
  status: ThreadItem["status"];
  label: string;
  badge?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("inline-block size-2 rounded-full", getThreadColor(status))}
      />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
          {badge}
        </span>
      )}
    </span>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-sm text-red-600">Failed to load threads</p>
      <p className="text-xs text-muted-foreground mt-1">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
      <p className="text-sm text-muted-foreground">No threads found</p>
    </div>
  );
}

interface ThreadListProps {
  onThreadSelect: (id: string) => void;
  onMutateReady?: (mutate: () => void) => void;
}

export function ThreadList({ onThreadSelect, onMutateReady }: ThreadListProps) {
  const [currentThreadId] = useQueryState("threadId");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  // Group threads by time and status
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

  const interruptedCount = useMemo(() => {
    return flattened.filter((t) => t.status === "interrupted").length;
  }, [flattened]);

  // Expose thread list revalidation to parent component
  // Use refs to create a stable callback that always calls the latest mutate function
  const onMutateReadyRef = useRef(onMutateReady);
  const mutateRef = useRef(threads.mutate);

  useEffect(() => {
    onMutateReadyRef.current = onMutateReady;
  }, [onMutateReady]);

  useEffect(() => {
    mutateRef.current = threads.mutate;
  }, [threads.mutate]);

  const mutateFn = useCallback(() => {
    mutateRef.current();
  }, []);

  useEffect(() => {
    onMutateReadyRef.current?.(mutateFn);
    // Only run once on mount to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Filter Dropdown - Always visible */}
      <div className="flex items-center justify-end px-4 py-3 border-b flex-shrink-0">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Active</SelectLabel>
              <SelectItem value="idle">
                <StatusFilterItem status="idle" label="Idle" />
              </SelectItem>
              <SelectItem value="busy">
                <StatusFilterItem status="busy" label="Busy" />
              </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Attention</SelectLabel>
              <SelectItem value="interrupted">
                <StatusFilterItem
                  status="interrupted"
                  label="Interrupted"
                  badge={interruptedCount}
                />
              </SelectItem>
              <SelectItem value="error">
                <StatusFilterItem status="error" label="Error" />
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 h-0">
        {threads.error && (
          <ErrorState message={threads.error.message} />
        )}

        {!threads.error && !threads.data && threads.isLoading && (
          <LoadingState />
        )}

        {!threads.error && !threads.isLoading && isEmpty && (
          <EmptyState />
        )}

        {!threads.error && !isEmpty && (
          <div className="p-4 space-y-6">
            {(
              Object.keys(GROUP_LABELS) as Array<keyof typeof GROUP_LABELS>
            ).map((group) => {
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
            })}

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
        )}
      </ScrollArea>
    </div>
  );
}
