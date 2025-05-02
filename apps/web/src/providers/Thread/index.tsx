"use client";

import {
  HumanResponse,
  ThreadData,
  EnhancedThreadStatus,
} from "@/components/agent-inbox/types";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { Run, Thread, ThreadStatus } from "@langchain/langgraph-sdk";
import React, { Dispatch, SetStateAction, useTransition } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  getInterruptFromThread,
  processInterruptedThread,
  processThreadWithoutInterrupts,
} from "./utils";
import { IMPROPER_SCHEMA } from "@/constants";
import { useAgentsContext } from "../Agents";

type ThreadContentType<
  ThreadValues extends Record<string, any> = Record<string, any>,
> = {
  loading: boolean;
  isChangingThreads: boolean;
  threadData: ThreadData<ThreadValues>[];
  hasMoreThreads: boolean;
  ignoreThread: (threadId: string) => Promise<void>;
  fetchThreads: (agentId: string, deploymentId: string) => Promise<void>;
  setThreadData: Dispatch<SetStateAction<ThreadData<Record<string, any>>[]>>;
  sendHumanResponse: <TStream extends boolean = false>(
    _threadId: string,
    _response: HumanResponse[],
    _options?: {
      stream?: TStream;
    },
  ) => TStream extends true
    ?
        | AsyncGenerator<{
            event: Record<string, any>;
            data: any;
          }>
        | undefined
    : Promise<Run> | undefined;
  fetchSingleThread: (
    _threadId: string,
  ) => Promise<ThreadData<ThreadValues> | undefined>;
};

const ThreadsContext = React.createContext<ThreadContentType | undefined>(
  undefined,
);

// Internal component that uses the context
function ThreadsProviderInternal<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ children }: { children: React.ReactNode }): React.ReactElement {
  const { agents } = useAgentsContext();
  const [agentInboxId] = useQueryState("agentInbox");
  // Need to track agent ID too since this context is used in the chat page which doesn't follow the agent inbox pattern
  const [agentId_] = useQueryState("agentId");
  const [isPending] = useTransition();

  const getAgentInboxIds = (): [string, string] | undefined => {
    if (agentInboxId) {
      const [assistantId, deploymentId] = agentInboxId.split(":");
      return [assistantId, deploymentId];
    }
    if (!agentId_) {
      return undefined;
    }
    const deploymentId = agents.find(
      (a) => a.assistant_id === agentId_,
    )?.deploymentId;
    if (!deploymentId) {
      return undefined;
    }
    return [agentId_, deploymentId];
  };

  // Get thread filter query params using the custom hook
  const [inboxParam] = useQueryState(
    "inbox",
    parseAsString.withDefault("interrupted"),
  );
  const [offsetParam] = useQueryState("offset", parseAsInteger.withDefault(0));
  const [limitParam] = useQueryState("limit", parseAsInteger.withDefault(10));

  const [loading, setLoading] = React.useState(false);
  const [threadData, setThreadData] = React.useState<
    ThreadData<Record<string, any>>[]
  >([]);
  const [hasMoreThreads, setHasMoreThreads] = React.useState(true);

  const fetchThreads = React.useCallback(
    async (agentId: string, deploymentId: string) => {
      setLoading(true);

      const client = createClient(deploymentId);

      try {
        // Use the values from queryParams
        const limit = limitParam;
        const offset = offsetParam;

        if (!limit) {
          throw new Error("Limit query param not found");
        }

        if (!offset && offset !== 0) {
          throw new Error("Offset query param not found");
        }

        if (limit > 100) {
          toast.error("Limit Exceeded", {
            description: "Cannot fetch more than 100 threads at a time",
            duration: 3000,
          });
          setLoading(false);
          return;
        }

        // Handle inbox filtering differently based on type
        let statusInput: { status?: ThreadStatus } = {};
        if (inboxParam !== "all" && inboxParam !== "human_response_needed") {
          statusInput = { status: inboxParam as ThreadStatus };
        }

        const threadSearchArgs = {
          offset,
          limit,
          ...statusInput,
          metadata: {
            assistant_id: agentId,
          },
        };

        const threads = await client.threads.search(threadSearchArgs);

        const processedData: ThreadData<ThreadValues>[] = [];

        // Process threads in batches with Promise.all for better performance
        const processPromises = threads.map(
          async (thread): Promise<ThreadData<ThreadValues>> => {
            const currentThread = thread as Thread<ThreadValues>;

            // Handle special cases for human_response_needed inbox
            if (
              inboxParam === "human_response_needed" &&
              currentThread.status !== "interrupted"
            ) {
              return {
                status: "human_response_needed" as EnhancedThreadStatus,
                thread: currentThread,
                interrupts: undefined,
                invalidSchema: undefined,
              };
            }

            if (currentThread.status === "interrupted") {
              // Try the faster processing method first
              const processedThreadData =
                processInterruptedThread(currentThread);
              if (
                processedThreadData &&
                processedThreadData.interrupts?.length
              ) {
                return processedThreadData as ThreadData<ThreadValues>;
              }

              // Only if necessary, do the more expensive thread state fetch
              try {
                // Attempt to get interrupts from state only if necessary
                const threadInterrupts = getInterruptFromThread(currentThread);
                if (!threadInterrupts || threadInterrupts.length === 0) {
                  const state = await client.threads.getState<ThreadValues>(
                    currentThread.thread_id,
                  );

                  return processThreadWithoutInterrupts(currentThread, {
                    thread_id: currentThread.thread_id,
                    thread_state: state,
                  }) as ThreadData<ThreadValues>;
                }

                // Return with the interrupts we found
                return {
                  status: "interrupted" as const,
                  thread: currentThread,
                  interrupts: threadInterrupts,
                  invalidSchema: threadInterrupts.some(
                    (interrupt) =>
                      interrupt?.action_request?.action === IMPROPER_SCHEMA ||
                      !interrupt?.action_request?.action,
                  ),
                };
              } catch (_) {
                // If all else fails, mark as invalid schema
                return {
                  status: "interrupted" as const,
                  thread: currentThread,
                  interrupts: undefined,
                  invalidSchema: true,
                };
              }
            } else {
              // Non-interrupted threads are simple
              return {
                status: currentThread.status,
                thread: currentThread,
                interrupts: undefined,
                invalidSchema: undefined,
              } as ThreadData<ThreadValues>;
            }
          },
        );

        // Process all threads concurrently
        const results = await Promise.all(processPromises);
        processedData.push(...results);

        const sortedData = processedData.sort((a, b) => {
          return (
            new Date(b.thread.created_at).getTime() -
            new Date(a.thread.created_at).getTime()
          );
        });

        setThreadData(sortedData);
        setHasMoreThreads(threads.length === limit);
      } catch (_) {
        toast.error("Failed to load threads. Please try again.");
      } finally {
        // Always reset loading state, even after errors
        setLoading(false);
      }
    },
    [offsetParam, limitParam],
  );

  // Effect to fetch threads when parameters change
  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!agentInboxId || !inboxParam || offsetParam == null || !limitParam) {
      return;
    }

    const [assistantId, deploymentId] = agentInboxId.split(":");

    try {
      // Fetch threads
      fetchThreads(assistantId, deploymentId);
    } catch (_) {
      toast.error("Failed to load threads. Please try again.");
      // Always reset loading state in case of error
      setLoading(false);
    }
  }, [agentInboxId, inboxParam, offsetParam, limitParam, fetchThreads]);

  const fetchSingleThread = React.useCallback(
    async (threadId: string): Promise<ThreadData<ThreadValues> | undefined> => {
      const agentInboxIds = getAgentInboxIds() ?? [];
      if (!agentInboxIds.length) {
        return;
      }
      const [_, deploymentId] = agentInboxIds;
      const client = createClient(deploymentId);

      try {
        const thread = await client.threads.get(threadId);
        const currentThread = thread as Thread<ThreadValues>;

        if (thread.status === "interrupted") {
          const threadInterrupts = getInterruptFromThread(currentThread);

          if (!threadInterrupts || !threadInterrupts.length) {
            const state = await client.threads.getState(threadId);
            const processedThread = processThreadWithoutInterrupts(
              currentThread,
              {
                thread_state: state,
                thread_id: threadId,
              },
            );

            if (processedThread) {
              return processedThread as ThreadData<ThreadValues>;
            }
          }

          // Return interrupted thread data
          return {
            thread: currentThread,
            status: "interrupted",
            interrupts: threadInterrupts,
            invalidSchema:
              !threadInterrupts ||
              threadInterrupts.length === 0 ||
              threadInterrupts.some(
                (interrupt) =>
                  interrupt?.action_request?.action === IMPROPER_SCHEMA ||
                  !interrupt?.action_request?.action,
              ),
          };
        }

        // Check for special human_response_needed status
        if (inboxParam === "human_response_needed") {
          return {
            thread: currentThread,
            status: "human_response_needed" as EnhancedThreadStatus,
            interrupts: undefined,
            invalidSchema: undefined,
          };
        }

        // Normal non-interrupted thread
        return {
          thread: currentThread,
          status: currentThread.status,
          interrupts: undefined,
          invalidSchema: undefined,
        };
      } catch (_) {
        toast.error("Failed to load thread details. Please try again.");
        return undefined;
      }
    },
    [inboxParam],
  );

  const ignoreThread = async (threadId: string) => {
    const agentInboxIds = getAgentInboxIds() ?? [];
    if (!agentInboxIds.length) {
      return;
    }
    const [_, deploymentId] = agentInboxIds;
    const client = createClient(deploymentId);

    try {
      setLoading(true);
      await client.threads.updateState(threadId, {
        values: null,
        asNode: "__end__",
      });

      setThreadData((prev) => {
        return prev.filter((p) => p.thread.thread_id !== threadId);
      });
      toast("Success", {
        description: "Ignored thread",
        duration: 3000,
      });
    } catch (_) {
      toast.error("Failed to ignore thread. Please try again.", {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendHumanResponse = <TStream extends boolean = false>(
    threadId: string,
    response: HumanResponse[],
    options?: {
      stream?: TStream;
    },
  ): TStream extends true
    ?
        | AsyncGenerator<{
            event: Record<string, any>;
            data: any;
          }>
        | undefined
    : Promise<Run> | undefined => {
    const agentInboxIds = getAgentInboxIds() ?? [];
    if (!agentInboxIds.length) {
      return;
    }
    const [assistantId, deploymentId] = agentInboxIds;
    const client = createClient(deploymentId);

    if (options?.stream) {
      return client.runs.stream(threadId, assistantId, {
        command: {
          resume: response,
        },
        streamMode: "events",
      }) as any; // Type assertion needed due to conditional return type
    }
    return client.runs.create(threadId, assistantId, {
      command: {
        resume: response,
      },
    }) as any; // Type assertion needed due to conditional return type
  };

  const contextValue: ThreadContentType = {
    loading,
    isChangingThreads: isPending,
    threadData,
    hasMoreThreads,
    ignoreThread,
    sendHumanResponse,
    fetchThreads,
    fetchSingleThread,
    setThreadData,
  };

  return (
    <ThreadsContext.Provider value={contextValue}>
      {children}
    </ThreadsContext.Provider>
  );
}

// Export the wrapped provider
export function ThreadsProvider<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <ThreadsProviderInternal<ThreadValues>>{children}</ThreadsProviderInternal>
  );
}

export function useThreadsContext<
  T extends Record<string, any> = Record<string, any>,
>() {
  const context = React.useContext(ThreadsContext) as ThreadContentType<T>;
  if (context === undefined) {
    throw new Error("useThreadsContext must be used within a ThreadsProvider");
  }
  return context;
}
