import {
  HumanResponse,
  HumanResponseWithEdits,
  SubmitType,
  ThreadData,
  InterruptedThreadData,
} from "../types";
import { toast } from "sonner";
import React from "react";
import { useThreadsContext } from "@/providers/Thread";
import { createDefaultHumanResponse } from "../utils";
import { INBOX_PARAM, VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";

import { useQueryState, parseAsString } from "nuqs";
import { logger } from "../utils/logger";
import { useAgentsContext } from "@/providers/Agents";

interface UseInterruptedActionsInput<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: InterruptedThreadData<ThreadValues> | null;
  setThreadData: React.Dispatch<
    React.SetStateAction<ThreadData<ThreadValues> | undefined>
  > | null;
}

interface UseInterruptedActionsValue {
  // Actions
  handleSubmit: (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent,
  ) => Promise<void>;
  handleIgnore: (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => Promise<void>;
  handleResolve: (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => Promise<void>;

  // State values
  streaming: boolean;
  streamFinished: boolean;
  currentNode: string;
  loading: boolean;
  threadId: string;
  isIgnoreAllowed: boolean;
  supportsMultipleMethods: boolean;
  selectedSubmitType: SubmitType | undefined;
  hasEdited: boolean;
  hasAddedResponse: boolean;
  acceptAllowed: boolean;
  humanResponse: HumanResponseWithEdits[];

  // State setters
  setSelectedSubmitType: React.Dispatch<
    React.SetStateAction<SubmitType | undefined>
  >;
  setHumanResponse: React.Dispatch<
    React.SetStateAction<HumanResponseWithEdits[]>
  >;
  setHasAddedResponse: React.Dispatch<React.SetStateAction<boolean>>;
  setHasEdited: React.Dispatch<React.SetStateAction<boolean>>;

  // Refs
  initialHumanInterruptEditValue: React.MutableRefObject<
    Record<string, string>
  >;
}

export default function useInterruptedActions<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  setThreadData,
}: UseInterruptedActionsInput<ThreadValues>): UseInterruptedActionsValue {
  const { agents } = useAgentsContext();
  const [selectedInbox] = useQueryState(
    INBOX_PARAM,
    parseAsString.withDefault("interrupted"),
  );
  const [agentInboxId] = useQueryState("agentInbox");
  const [, setSelectedThreadId] = useQueryState(
    VIEW_STATE_THREAD_QUERY_PARAM,
    parseAsString,
  );
  const [agentId_] = useQueryState("agentId");

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

  const { fetchSingleThread, fetchThreads, sendHumanResponse, ignoreThread } =
    useThreadsContext<ThreadValues>();

  const [humanResponse, setHumanResponse] = React.useState<
    HumanResponseWithEdits[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [streaming, setStreaming] = React.useState(false);
  const [currentNode, setCurrentNode] = React.useState("");
  const [streamFinished, setStreamFinished] = React.useState(false);
  const initialHumanInterruptEditValue = React.useRef<Record<string, string>>(
    {},
  );
  const [selectedSubmitType, setSelectedSubmitType] =
    React.useState<SubmitType>();
  // Whether or not the user has edited any fields which allow editing.
  const [hasEdited, setHasEdited] = React.useState(false);
  // Whether or not the user has added a response.
  const [hasAddedResponse, setHasAddedResponse] = React.useState(false);
  const [acceptAllowed, setAcceptAllowed] = React.useState(false);

  React.useEffect(() => {
    try {
      if (
        !threadData ||
        !threadData.interrupts ||
        threadData.interrupts.length === 0
      )
        return;
      const { responses, defaultSubmitType, hasAccept } =
        createDefaultHumanResponse(
          threadData.interrupts,
          initialHumanInterruptEditValue,
        );
      setSelectedSubmitType(defaultSubmitType);
      setHumanResponse(responses);
      setAcceptAllowed(hasAccept);
    } catch (e) {
      console.error("Error formatting and setting human response state", e);
      // Set fallback values for invalid interrupts
      setHumanResponse([{ type: "ignore", args: null }]);
      setSelectedSubmitType(undefined);
      setAcceptAllowed(false);
      logger.error("Error formatting and setting human response state", e);
    }
  }, [threadData?.interrupts]);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent,
  ) => {
    e.preventDefault();
    const agentInboxIds = getAgentInboxIds() ?? [];
    if (!agentInboxIds.length) {
      return;
    }
    const [assistantId, deploymentId] = agentInboxIds;

    if (!threadData || !setThreadData) {
      toast.error("Thread data is not available");
      return;
    }
    if (!humanResponse) {
      toast.error("Please enter a response.");
      return;
    }
    if (!selectedInbox) {
      toast.error("No inbox selected");
      return;
    }

    let errorOccurred = false;
    initialHumanInterruptEditValue.current = {};

    if (
      humanResponse.some((r) => ["response", "edit", "accept"].includes(r.type))
    ) {
      setStreamFinished(false);
      setCurrentNode("");

      try {
        const humanResponseInput: HumanResponse[] = humanResponse.flatMap(
          (r) => {
            if (r.type === "edit") {
              if (r.acceptAllowed && !r.editsMade) {
                return {
                  type: "accept",
                  args: r.args,
                };
              } else {
                return {
                  type: "edit",
                  args: r.args,
                };
              }
            }

            if (r.type === "response" && !r.args) {
              // If response was allowed but no response was given, do not include in the response
              return [];
            }
            return {
              type: r.type,
              args: r.args,
            };
          },
        );

        const input = humanResponseInput.find(
          (r) => r.type === selectedSubmitType,
        );
        if (!input) {
          toast.error("No response found.");
          return;
        }

        setLoading(true);
        setStreaming(true);
        const response = sendHumanResponse(
          threadData.thread.thread_id,
          [input],
          {
            stream: true,
          },
        );
        if (!response) {
          // This will only be undefined if the graph ID is not found
          // in this case, the method will trigger a toast for us.
          return;
        }

        toast("Success", {
          description: "Response submitted successfully.",
          duration: 5000,
        });

        for await (const chunk of response) {
          if (
            chunk.data?.event === "on_chain_start" &&
            chunk.data?.metadata?.langgraph_node
          ) {
            setCurrentNode(chunk.data.metadata.langgraph_node);
          } else if (
            typeof chunk.event === "string" &&
            chunk.event === "error"
          ) {
            toast.error("Error", {
              description: (
                <div className="flex flex-col items-start gap-1">
                  <p>Something went wrong while attempting to run the graph.</p>
                  <span>
                    <strong>Error:</strong>
                    <span className="font-mono">
                      {JSON.stringify(chunk.data, null)}
                    </span>
                  </span>
                </div>
              ),
              duration: 15000,
            });
            setCurrentNode("__error__");
            errorOccurred = true;
          }
        }

        if (!errorOccurred) {
          setStreamFinished(true);
        }
      } catch (e: any) {
        logger.error("Error sending human response", e);

        if ("message" in e && e.message.includes("Invalid assistant ID")) {
          toast.error("Error: Invalid assistant ID", {
            description:
              "The provided assistant ID was not found in this graph. Please update the assistant ID in the settings and try again.",
            duration: 5000,
          });
        } else {
          toast.error("Failed to submit response.", {
            duration: 5000,
          });
        }

        errorOccurred = true;
        setCurrentNode("");
        setStreaming(false);
        setStreamFinished(false);
      }

      if (!errorOccurred) {
        setCurrentNode("");
        setStreaming(false);
        const updatedThreadData = await fetchSingleThread(
          threadData.thread.thread_id,
        );
        if (updatedThreadData && updatedThreadData?.status === "interrupted") {
          setThreadData(updatedThreadData as ThreadData<ThreadValues>);
        } else {
          // Re-fetch threads before routing back so the inbox is up to date
          await fetchThreads(assistantId, deploymentId);
          // Clear the selected thread ID to go back to inbox view
          await setSelectedThreadId(null);
        }
        setStreamFinished(false);
      }
    } else {
      setLoading(true);
      await sendHumanResponse(threadData.thread.thread_id, humanResponse);

      toast("Success", {
        description: "Response submitted successfully.",
        duration: 5000,
      });
    }

    setLoading(false);
  };

  const handleIgnore = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    const agentInboxIds = getAgentInboxIds() ?? [];
    if (!agentInboxIds.length) {
      return;
    }
    const [assistantId, deploymentId] = agentInboxIds;

    if (!threadData || !setThreadData) {
      toast.error("Thread data is not available");
      return;
    }

    // For invalid interrupts, create an ignore response if not found
    let ignoreResponse = humanResponse.find((r) => r.type === "ignore");
    if (!ignoreResponse) {
      ignoreResponse = { type: "ignore", args: null };
    }

    if (!selectedInbox) {
      toast.error("No inbox selected");
      return;
    }

    setLoading(true);
    initialHumanInterruptEditValue.current = {};

    await sendHumanResponse(threadData.thread.thread_id, [ignoreResponse]);
    // Re-fetch threads before routing back so the inbox is up to date
    await fetchThreads(assistantId, deploymentId);

    setLoading(false);
    toast("Successfully ignored thread", {
      duration: 5000,
    });
    // Clear the selected thread ID to go back to inbox view
    await setSelectedThreadId(null);
  };

  const handleResolve = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    const agentInboxIds = getAgentInboxIds() ?? [];
    if (!agentInboxIds.length) {
      return;
    }
    const [assistantId, deploymentId] = agentInboxIds;

    if (!threadData || !setThreadData) {
      toast.error("Thread data is not available");
      return;
    }
    if (!selectedInbox) {
      toast.error("No inbox selected");
      return;
    }

    setLoading(true);
    initialHumanInterruptEditValue.current = {};

    await ignoreThread(threadData.thread.thread_id);
    await fetchThreads(assistantId, deploymentId);

    setLoading(false);
    // Clear the selected thread ID to go back to inbox view
    await setSelectedThreadId(null);
  };

  return {
    handleSubmit,
    handleIgnore,
    handleResolve,
    streaming,
    streamFinished,
    currentNode,
    loading,
    threadId: threadData?.thread.thread_id || "",
    isIgnoreAllowed:
      Boolean(threadData?.interrupts?.[0]?.config?.allow_ignore) || true, // Default to true for invalid interrupts
    supportsMultipleMethods:
      humanResponse.filter(
        (r) =>
          r.type === "edit" || r.type === "accept" || r.type === "response",
      ).length > 1,
    selectedSubmitType,
    hasEdited,
    hasAddedResponse,
    acceptAllowed,
    humanResponse,
    setSelectedSubmitType,
    setHumanResponse,
    setHasAddedResponse,
    setHasEdited,
    initialHumanInterruptEditValue,
  };
}
