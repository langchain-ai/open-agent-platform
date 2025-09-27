"use client";

import { useCallback } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  type Message,
  type Assistant,
  type Checkpoint,
} from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import type { TodoItem } from "../types";
import { useClients } from "../providers/ClientProvider";
import { HumanResponse } from "../types/inbox";

type StateType = {
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
};

export function useChat(
  threadId: string | null,
  setThreadId: (
    value: string | ((old: string | null) => string | null) | null,
  ) => void,
  onTodosUpdate: (todos: TodoItem[]) => void,
  files: Record<string, string>,
  onFilesUpdate: (files: Record<string, string>) => void,
  activeAssistant: Assistant | null,
) {
  const { client } = useClients();

  const handleUpdateEvent = useCallback(
    (data: { [node: string]: Partial<StateType> }) => {
      Object.values(data).forEach((nodeData) => {
        if (nodeData?.todos !== undefined) {
          onTodosUpdate(nodeData.todos);
        }
        if (nodeData?.files !== undefined) {
          onFilesUpdate(nodeData.files);
        }
      });
    },
    [onTodosUpdate, onFilesUpdate],
  );

  const stream = useStream<StateType>({
    assistantId: activeAssistant?.assistant_id || "",
    client: client ?? undefined,
    reconnectOnMount: true,
    threadId: threadId ?? null,
    onUpdateEvent: handleUpdateEvent,
    onThreadId: setThreadId,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      const humanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: message,
      };
      stream.submit(
        { messages: [humanMessage], files },
        {
          optimisticValues: {
            messages: [...(stream.messages ?? []), humanMessage],
          },
          config: {
            ...(activeAssistant?.config || {}),
            recursion_limit: 100,
          },
        },
      );
    },
    [stream, activeAssistant?.config, files],
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
          config: {
            ...(activeAssistant?.config || {}),
          },
          checkpoint: checkpoint,
          ...(isRerunningSubagent
            ? { interruptAfter: ["tools"] }
            : { interruptBefore: ["tools"] }),
        });
      } else {
        stream.submit(
          { messages, files },
          {
            config: {
              ...(activeAssistant?.config || {}),
            },
            interruptBefore: ["tools"],
          },
        );
      }
    },
    [stream, activeAssistant?.config, files],
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
    stream.submit(null, {
      command: {
        resume: response,
      },
    });
  };

  const markCurrentThreadAsResolved = (): void => {
    stream.submit(null, {
      command: {
        goto: "__end__",
        update: null,
      },
    });
  };

  const stopStream = useCallback(() => {
    stream.stop();
  }, [stream]);

  return {
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
