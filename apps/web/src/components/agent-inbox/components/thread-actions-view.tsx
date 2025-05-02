import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ClockIcon,
  AlertCircle,
  Loader,
} from "lucide-react";
import { ThreadData, GenericThreadData } from "../types";
import useInterruptedActions from "../hooks/use-interrupted-actions";
import { constructOpenInStudioURL } from "../utils";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemInput } from "./inbox-item-input";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { IMPROPER_SCHEMA } from "@/constants";
import {
  STUDIO_NOT_WORKING_TROUBLESHOOTING_URL,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryStates, parseAsString, useQueryState } from "nuqs";
import { useThreadsContext } from "@/providers/Thread";
import { useMemo, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InterruptDetailsView } from "./interrupt-details-view";

import { logger } from "../utils/logger";

interface ThreadActionsViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  isInterrupted: boolean;
  showState: boolean;
  showDescription: boolean;
  handleShowSidePanel?: (
    _showState: boolean,
    _showDescription: boolean,
  ) => void;
  setThreadData: React.Dispatch<
    React.SetStateAction<ThreadData<ThreadValues> | undefined>
  >;
}

function ButtonGroup({
  handleShowState,
  handleShowDescription,
  showingState,
  showingDescription,
}: {
  handleShowState: () => void;
  handleShowDescription: () => void;
  showingState: boolean;
  showingDescription: boolean;
}) {
  return (
    <div className="flex flex-row items-center justify-center gap-0">
      <Button
        variant="outline"
        className={cn(
          "rounded-l-md rounded-r-none border-r-[0px]",
          showingState ? "text-black" : "bg-white",
        )}
        size="sm"
        onClick={handleShowState}
      >
        State
      </Button>
      <Button
        variant="outline"
        className={cn(
          "rounded-l-none rounded-r-md border-l-[0px]",
          showingDescription ? "text-black" : "bg-white",
        )}
        size="sm"
        onClick={handleShowDescription}
      >
        Description
      </Button>
    </div>
  );
}

// Helper type guard functions
function isIdleThread<T extends Record<string, any>>(
  threadData: ThreadData<T>,
): threadData is GenericThreadData<T> & { status: "idle" } {
  return threadData.status === "idle";
}

function isBusyThread<T extends Record<string, any>>(
  threadData: ThreadData<T>,
): threadData is GenericThreadData<T> & { status: "busy" } {
  return threadData.status === "busy";
}

function isErrorThread<T extends Record<string, any>>(
  threadData: ThreadData<T>,
): threadData is GenericThreadData<T> & { status: "error" } {
  return threadData.status === "error";
}

export function ThreadActionsView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  isInterrupted: _propIsInterrupted,
  showDescription,
  showState,
  handleShowSidePanel,
  setThreadData,
}: ThreadActionsViewProps<ThreadValues>) {
  const [agentInboxId] = useQueryState("agentInbox");
  const { fetchSingleThread } = useThreadsContext<ThreadValues>();
  const [, setQueryParams] = useQueryStates({
    [VIEW_STATE_THREAD_QUERY_PARAM]: parseAsString,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Derive thread title
  const threadTitle = useMemo(() => {
    if (
      threadData?.interrupts?.[0]?.action_request?.action &&
      threadData.interrupts[0].action_request.action !== IMPROPER_SCHEMA
    ) {
      return threadData.interrupts[0].action_request.action;
    }
    return `Thread: ${threadData?.thread.thread_id.slice(0, 6)}...`;
  }, [threadData]);

  // Only use interrupted actions for interrupted threads
  const isInterrupted =
    threadData.status === "interrupted" &&
    threadData.interrupts !== undefined &&
    threadData.interrupts.length > 0;

  // Initialize the hook outside of conditional to satisfy React rules of hooks
  const actions = useInterruptedActions<ThreadValues>({
    threadData: isInterrupted
      ? {
          thread: threadData.thread,
          status: "interrupted",
          interrupts: threadData.interrupts || [],
        }
      : null,
    setThreadData,
  });

  const handleOpenInStudio = (id: string) => {
    const [assistantId, deploymentId] = id.split(":");

    const studioUrl = constructOpenInStudioURL(
      assistantId,
      deploymentId,
      threadData.thread.thread_id,
    );

    if (studioUrl === "#") {
      // Handle case where URL construction failed (e.g., missing data)
      toast.error(
        "Could not construct Studio URL. Check if inbox has necessary details (Project ID, Tenant ID).",
        {
          description: (
            <>
              <p>
                Could not construct Studio URL. Check if inbox has necessary
                details (Project ID, Tenant ID).
              </p>
              <p>
                If the issue persists, see the{" "}
                <a
                  href={STUDIO_NOT_WORKING_TROUBLESHOOTING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  troubleshooting section
                </a>
              </p>
            </>
          ),
          duration: 10000,
        },
      );
    } else {
      window.open(studioUrl, "_blank");
    }
  };

  const handleRefreshThread = async () => {
    // Use selectedInbox here as well
    if (!agentInboxId) {
      toast.error("No agent inbox selected.", { richColors: true });
      return;
    }

    setRefreshing(true);
    try {
      toast("Refreshing thread", {
        description: "Checking for updates to the thread status...",
        duration: 3000,
      });

      // Fetch the latest thread data using the ThreadsContext
      await fetchSingleThread(threadData.thread.thread_id);

      toast("Thread refreshed", {
        description: "Thread information has been updated.",
        duration: 3000,
      });
    } catch (error) {
      logger.error("Error refreshing thread:", error);
      toast.error("Failed to refresh thread information.");
    } finally {
      setRefreshing(false);
    }
  };

  // Use the passed handleShowSidePanel prop or update query params directly
  const updateSidePanel = (state: boolean, description: boolean) => {
    if (handleShowSidePanel) {
      handleShowSidePanel(state, description);
    } else {
      setQueryParams({
        [VIEW_STATE_THREAD_QUERY_PARAM]: String(state),
      });
      setQueryParams({
        [VIEW_STATE_THREAD_QUERY_PARAM]: String(description),
      });
    }
  };

  // Safely access config for determining allowed actions
  const firstInterrupt = threadData.interrupts?.[0];
  const config = firstInterrupt?.config;
  const ignoreAllowed = config?.allow_ignore ?? false;
  const acceptAllowed = config?.allow_accept ?? false;

  // Status Icon Logic
  const getStatusIcon = () => {
    if (isIdleThread(threadData)) {
      return <ClockIcon className="h-4 w-4 text-gray-500" />;
    } else if (isBusyThread(threadData)) {
      return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
    } else if (isErrorThread(threadData)) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Handle Invalid  Interrupt Threads
  /////////////////////////////////////
  if (threadData.invalidSchema) {
    return (
      <div className="flex min-h-full w-full flex-col">
        <div className="flex w-full flex-col gap-9 p-12">
          {/* Header (minimal) */}
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex items-center justify-start gap-3">
              <TooltipIconButton
                tooltip="Back to inbox"
                variant="ghost"
                onClick={() => {
                  setQueryParams({
                    [VIEW_STATE_THREAD_QUERY_PARAM]: "",
                  });
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </TooltipIconButton>
              <div className="flex items-center gap-2">
                <p className="text-2xl tracking-tighter text-pretty">
                  {threadTitle}
                </p>
              </div>
              <ThreadIdCopyable threadId={threadData.thread.thread_id} />
            </div>
            {/* Right-side controls with ButtonGroup */}
            <div className="flex flex-row items-center justify-start gap-2">
              {agentInboxId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 bg-white"
                  onClick={() => handleOpenInStudio(agentInboxId)}
                >
                  Studio
                </Button>
              )}
              <ButtonGroup
                handleShowState={() => updateSidePanel(true, false)}
                handleShowDescription={() => updateSidePanel(false, true)}
                showingState={showState}
                showingDescription={showDescription}
              />
            </div>
          </div>

          {/* Interrupt details on the left for invalid interrupts */}
          <InterruptDetailsView threadData={threadData} />

          {/* Invalid schema message */}
          <div className="w-full rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-700">
            This thread is interrupted, but the required action data is missing
            or invalid. Standard interrupt actions cannot be performed.
          </div>

          {/* You might still allow ignoring the thread */}
          <div className="flex w-full flex-row items-center justify-start gap-2">
            <Button
              variant="outline"
              className="border-gray-500 bg-white font-normal text-gray-800"
              onClick={actions?.handleIgnore} // Assuming ignore doesn't need config
              disabled={actions?.loading}
            >
              Ignore Thread
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle generic Non-Interrupted Threads
  ////////////////////////////////////////
  if (
    threadData.status !== "interrupted" ||
    !threadData.interrupts ||
    threadData.interrupts.length === 0
  ) {
    return (
      <div className="flex min-h-full w-full flex-col gap-9 p-12">
        {/* Header */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center justify-start gap-3">
            <TooltipIconButton
              tooltip="Back to inbox"
              variant="ghost"
              onClick={() => {
                setQueryParams({
                  [VIEW_STATE_THREAD_QUERY_PARAM]: "",
                });
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </TooltipIconButton>
            <div className="flex items-center gap-2">
              {!isInterrupted && getStatusIcon()}
              {isInterrupted && !threadData.invalidSchema && (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}{" "}
              {/* Icon for valid interrupt */}
              <p className="text-2xl tracking-tighter text-pretty">
                {threadTitle}
              </p>
            </div>
            <ThreadIdCopyable threadId={threadData.thread.thread_id} />
          </div>
          <div className="flex flex-row items-center justify-start gap-2">
            {agentInboxId && (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 bg-white"
                onClick={() => handleOpenInStudio(agentInboxId)}
              >
                Studio
              </Button>
            )}
            <ButtonGroup
              handleShowState={() => updateSidePanel(true, false)}
              handleShowDescription={() => updateSidePanel(false, true)}
              showingState={showState}
              showingDescription={showDescription}
            />
          </div>
        </div>

        {/* Non-interrupted thread actions */}
        <div className="flex flex-col gap-6">
          {/* Status-specific UI */}
          {(isIdleThread(threadData) || isBusyThread(threadData)) && (
            <div className="flex w-full flex-row items-center justify-start gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-500 bg-white font-normal text-gray-800"
                onClick={handleRefreshThread}
                disabled={refreshing}
              >
                <RefreshCw
                  className={cn("h-4 w-4", refreshing && "animate-spin")}
                />
                {refreshing ? "Refreshing..." : "Refresh Thread Status"}
              </Button>
            </div>
          )}

          {isErrorThread(threadData) && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
                <div>
                  <h3 className="font-medium text-red-800">Error State</h3>
                  <p className="mt-1 text-sm text-red-700">
                    This thread is in an error state. You may need to check the
                    logs or retry the operation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thread information summary */}
          <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-medium">Thread Details</h3>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 capitalize">{threadData.status}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2">
                  {new Date(threadData.thread.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Last updated:</span>
                <span className="ml-2">
                  {new Date(threadData.thread.updated_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="font-medium text-gray-700">ID:</span>
                <span className="ml-2 font-mono text-xs">
                  {threadData.thread.thread_id}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            View the thread state in the &quot;State&quot; tab for detailed
            information about this thread.
          </p>
        </div>
      </div>
    );
  }

  // Handle Valid Interrupted Threads
  //////////////////////////////////////////////////////////
  return (
    <div className="flex min-h-full w-full flex-col gap-9 p-12">
      {/* Header */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex items-center justify-start gap-3">
          <TooltipIconButton
            tooltip="Back to inbox"
            variant="ghost"
            onClick={() => {
              setQueryParams({
                [VIEW_STATE_THREAD_QUERY_PARAM]: "",
              });
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </TooltipIconButton>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-2xl tracking-tighter text-pretty">
              {threadTitle}
            </p>
          </div>
          <ThreadIdCopyable threadId={threadData.thread.thread_id} />
        </div>
        <div className="flex flex-row items-center justify-start gap-2">
          {agentInboxId && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 bg-white"
              onClick={() => handleOpenInStudio(agentInboxId)}
            >
              Studio
            </Button>
          )}
          {/* Added ButtonGroup for interrupted threads */}
          <ButtonGroup
            handleShowState={() => updateSidePanel(true, false)}
            handleShowDescription={() => updateSidePanel(false, true)}
            showingState={showState}
            showingDescription={showDescription}
          />
        </div>
      </div>

      {/* Interrupted thread actions */}
      <div className="flex w-full flex-row items-center justify-start gap-2">
        <Button
          variant="outline"
          className="border-gray-500 bg-white font-normal text-gray-800"
          onClick={actions?.handleResolve}
          disabled={actions?.loading}
        >
          Mark as Resolved
        </Button>
        {ignoreAllowed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={actions?.handleIgnore}
                disabled={actions?.loading}
              >
                Ignore
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Ignore this interrupt and end the thread.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Actions */}
      <InboxItemInput
        acceptAllowed={acceptAllowed}
        hasEdited={actions?.hasEdited ?? false}
        hasAddedResponse={actions?.hasAddedResponse ?? false}
        interruptValue={firstInterrupt!}
        humanResponse={actions?.humanResponse as any}
        initialValues={actions?.initialHumanInterruptEditValue.current || {}}
        setHumanResponse={actions?.setHumanResponse ?? (() => {})}
        streaming={actions?.streaming ?? false}
        streamFinished={actions?.streamFinished ?? false}
        currentNode={actions?.currentNode ?? ""}
        supportsMultipleMethods={actions?.supportsMultipleMethods ?? false}
        setSelectedSubmitType={actions?.setSelectedSubmitType ?? (() => {})}
        setHasAddedResponse={actions?.setHasAddedResponse ?? (() => {})}
        setHasEdited={actions?.setHasEdited ?? (() => {})}
        handleSubmit={
          actions?.handleSubmit ??
          (async (
            _e:
              | React.MouseEvent<HTMLButtonElement, MouseEvent>
              | React.KeyboardEvent,
          ) => {})
        }
      />
    </div>
  );
}
