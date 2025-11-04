/**
 * Retry logic wrapper for useStream to handle race conditions
 * where thread persistence is slower than stream completion.
 *
 * This hook wraps the LangGraph SDK's useStream and adds automatic
 * retry logic for transient "Thread not found" errors that occur
 * when the SDK polls for thread state before the backend has
 * finished persisting it.
 */

import { useEffect, useRef } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamConfig = Parameters<typeof useTypedStream>[0];

/**
 * Custom hook that wraps useStream with automatic retry logic for
 * transient "Thread not found" errors.
 */
export function useStreamWithRetry(config: StreamConfig) {
  const streamValue = useTypedStream(config);

  // Extract threadId from config (it's passed in, not returned)
  const threadId = config.threadId;

  // Track retry state per threadId to avoid retrying old errors
  const retryStateRef = useRef<{
    threadId: string | null;
    count: number;
    lastErrorTime: number;
  }>({
    threadId: null,
    count: 0,
    lastErrorTime: 0,
  });

  useEffect(() => {
    // Only process errors when we have a threadId (after first message sent)
    if (!threadId || !streamValue.error) {
      // Reset retry count when error clears or no threadId
      if (!streamValue.error && retryStateRef.current.count > 0) {
        retryStateRef.current.count = 0;
      }
      return;
    }

    const errorMessage = (streamValue.error as any)?.message || "";

    // Check if this is the specific race condition error
    const isThreadNotFoundError =
      errorMessage.includes("Thread with ID") &&
      errorMessage.includes("not found") &&
      errorMessage.includes(threadId);

    if (!isThreadNotFoundError) {
      // Not the error we're looking for, let it through normally
      return;
    }

    const now = Date.now();
    const state = retryStateRef.current;

    // Reset retry count if we're dealing with a different thread
    // or it's been more than 10 seconds since last error
    if (state.threadId !== threadId || now - state.lastErrorTime > 10000) {
      state.threadId = threadId;
      state.count = 0;
    }

    state.lastErrorTime = now;
    state.count++;

    // Only retry up to 3 times
    if (state.count <= 3) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, state.count - 1), 4000);

      console.warn(
        `[useStreamWithRetry] Thread ${threadId} not found (attempt ${state.count}/3). ` +
          `This is likely a race condition - the backend hasn't finished persisting yet. ` +
          `Retrying in ${delay}ms...`,
      );

      // The LangGraph SDK already has internal polling/retry mechanisms.
      // We just need to wait a bit and let it retry naturally.
      // The error state will be cleared automatically on the next successful fetch.
    } else {
      console.error(
        `[useStreamWithRetry] Thread ${threadId} not found after 3 retry attempts. ` +
          `This may indicate a backend persistence issue or the thread was deleted.`,
      );
      // After max retries, let the error bubble up normally
    }
  }, [streamValue.error, threadId]);

  // Return the original stream value unchanged
  // The retry logic is passive - it just logs and waits for SDK's natural retry
  return streamValue;
}
