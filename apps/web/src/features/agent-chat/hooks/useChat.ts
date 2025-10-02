"use client";

import { useCallback } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  type Message,
  type Assistant,
  type Checkpoint,
} from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import type { UseStreamThread } from "@langchain/langgraph-sdk/react";
import type { TodoItem } from "../types";
import { useClients } from "../providers/ClientProvider";
import { HumanResponse } from "../types/inbox";
import { useQueryState } from "nuqs";

export type StateType = {
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
};

export function useChat({
  activeAssistant,
  onHistoryRevalidate,
  thread,
  testMode,
}: {
  activeAssistant: Assistant | null;
  onHistoryRevalidate?: () => void;
  thread?: UseStreamThread<StateType>;
  testMode?: boolean;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { client } = useClients();

  const stream = useStream<StateType>({
    assistantId: activeAssistant?.assistant_id || "",
    client: client ?? undefined,
    reconnectOnMount: true,
    threadId: threadId ?? null,
    onThreadId: setThreadId,
    defaultHeaders: { "x-auth-scheme": "langsmith" },
    onFinish: onHistoryRevalidate,
    onError: onHistoryRevalidate,
    onCreated: onHistoryRevalidate,
    experimental_thread: thread,
  });

  const sendMessage = useCallback(
    (content: string) => {
      const newMessage: Message = { id: uuidv4(), type: "human", content };
      const metadata = testMode ? { testMode: true } : undefined;
      stream.submit(
        {
          messages: [newMessage],
          ...(metadata ? { metadata } : {}),
        },
        {
          optimisticValues: (prev) => ({
            messages: [...(prev.messages ?? []), newMessage],
          }),
          config: { ...(activeAssistant?.config ?? {}), recursion_limit: 100 },
        },
      );
    },
    [stream, activeAssistant?.config, testMode],
  );

  const runSingleStep = useCallback(
    (
      messages: Message[],
      checkpoint?: Checkpoint,
      isRerunningSubagent?: boolean,
      optimisticMessages?: Message[],
    ) => {
      if (checkpoint) {
        stream.submit(undefined, {
          ...(optimisticMessages
            ? { optimisticValues: { messages: optimisticMessages } }
            : {}),
          config: activeAssistant?.config,
          checkpoint: checkpoint,
          ...(isRerunningSubagent
            ? { interruptAfter: ["tools"] }
            : { interruptBefore: ["tools"] }),
        });
      } else {
        const metadata = testMode ? { testMode: true } : undefined;
        stream.submit(
          {
            messages,
            ...(metadata ? { metadata } : {}),
          },
          { config: activeAssistant?.config, interruptBefore: ["tools"] },
        );
      }
    },
    [stream, activeAssistant?.config, testMode],
  );

  const setFiles = useCallback(
    async (files: Record<string, string>) => {
      if (!threadId) return;
      // TODO: missing a way how to revalidate the internal state
      // I think we do want to have the ability to externally manage the state
      await client.threads.updateState(threadId, { values: { files } });
    },
    [client, threadId],
  );

  const continueStream = useCallback(
    (hasTaskToolCall?: boolean) => {
      stream.submit(undefined, {
        config: {
          ...(activeAssistant?.config || {}),
          recursion_limit: 100,
        },
        ...(hasTaskToolCall
          ? { interruptAfter: ["tools"] }
          : { interruptBefore: ["tools"] }),
      });
    },
    [stream, activeAssistant?.config],
  );

  const sendHumanResponse = (response: HumanResponse[]): void => {
    stream.submit(null, { command: { resume: response } });
  };

  const markCurrentThreadAsResolved = (): void => {
    stream.submit(null, { command: { goto: "__end__", update: null } });
  };

  const stopStream = useCallback(() => {
    stream.stop();
  }, [stream]);

  return {
    todos: stream.values.todos ?? [],
    files: stream.values.files ?? {},
    setFiles,
    messages: stream.messages,
    isLoading: stream.isLoading,
    isThreadLoading: stream.isThreadLoading,
    interrupt: stream.interrupt,
    getMessagesMetadata: stream.getMessagesMetadata,
    sendMessage,
    runSingleStep,
    continueStream,
    stopStream,
    sendHumanResponse,
    markCurrentThreadAsResolved,
  };
}
