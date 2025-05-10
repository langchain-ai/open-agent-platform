"use client";

import { cn } from "@/lib/utils";
import { Message, Thread } from "@langchain/langgraph-sdk";
import { useEffect, useState, forwardRef, ForwardedRef } from "react";
import { useQueryState } from "nuqs";
import { createClient } from "@/lib/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuthContext } from "@/providers/Auth";

/**
 * Returns the first human message from a thread
 * @param thread The thread to get the first human message from
 * @returns The first human message content, or an empty string if no human message is found
 */
function getFirstHumanMessageContent(thread: Thread) {
  try {
    if (
      Array.isArray(thread.values) ||
      !("messages" in thread.values) ||
      !thread.values.messages ||
      !Array.isArray(thread.values.messages) ||
      !thread.values.messages.length
    )
      return "";
    const castMessages = thread.values.messages as Message[];

    const firstHumanMsg = castMessages.find((msg) => msg.type === "human");
    return (firstHumanMsg?.content ?? "") as string;
  } catch (e) {
    console.error("Failed to get human message from thread", {
      thread,
      error: e,
    });
    return "";
  }
}

const formatDate = (date: string) => {
  try {
    return format(new Date(date), "MM/dd/yyyy - h:mm a");
  } catch (e) {
    console.error("Failed to format date", { date, error: e });
    return "";
  }
};

export interface ThreadHistorySidebarProps {
  className?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ThreadHistorySidebar = forwardRef<
  HTMLDivElement,
  ThreadHistorySidebarProps
>(({ className, open, setOpen }, ref: ForwardedRef<HTMLDivElement>) => {
  const { session } = useAuthContext();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useQueryState("threadId");
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId || !deploymentId || !session?.accessToken) return;

    const getAgentThreads = async (
      _agentId: string,
      _deploymentId: string,
      accessToken: string,
    ) => {
      setLoading(true);

      try {
        const client = createClient(_deploymentId, accessToken);

        const threads = await client.threads.search({
          limit: 100,
          metadata: {
            assistant_id: _agentId,
          },
        });
        setThreads(threads);
      } catch (e) {
        console.error("Failed to fetch threads", e);
        toast.error("Failed to fetch threads");
      } finally {
        setLoading(false);
      }
    };

    getAgentThreads(agentId, deploymentId, session.accessToken);
  }, [agentId, deploymentId, session?.accessToken]);

  const handleChangeThread = (id: string) => {
    if (threadId === id) return;
    setThreadId(id);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "fixed top-0 right-0 z-10 h-screen border-l border-gray-200 bg-white shadow-lg transition-all duration-300",
        open ? "w-80 md:w-xl" : "w-0 overflow-hidden border-l-0",
        className,
      )}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold">History</h2>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center p-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton
                  key={`thread-loading-${index}`}
                  className="h-8 w-full"
                />
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {threads.map((thread) => {
                const isSelected = thread.thread_id === threadId;
                return (
                  <div
                    key={thread.thread_id}
                    className={cn(
                      "flex items-center justify-between p-4 transition-all duration-300 hover:cursor-pointer hover:bg-gray-50",
                      isSelected
                        ? "bg-gray-100 hover:cursor-default hover:bg-gray-100"
                        : "",
                    )}
                    onClick={() => handleChangeThread(thread.thread_id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-gray-200" />
                      <div className="flex flex-col">
                        {/* Use the first human message as the title */}
                        <p className="line-clamp-1 truncate text-sm font-medium">
                          {getFirstHumanMessageContent(thread) ||
                            thread.thread_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(thread.created_at)}
                        </p>
                      </div>
                    </div>
                    {/* TODO: Add save/delete buttons back if needed */}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ThreadHistorySidebar.displayName = "ThreadHistorySidebar";
