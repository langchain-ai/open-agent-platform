import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ThreadData } from "@/types/inbox";
import useInterruptedActions from "./hooks/use-interrupted-actions";
import { ThreadIdCopyable } from "./components/thread-id";
import { InboxItemInput } from "./components/inbox-item-input";
import { useChatContext } from "@/providers/ChatProvider";
import { Interrupt } from "@langchain/langgraph-sdk";

interface ThreadActionsViewProps {
  threadData: ThreadData;
  threadTitle: string;
  interrupt: Interrupt;
}

export function ThreadActionsView({
  threadData,
  threadTitle,
}: ThreadActionsViewProps) {
  const { isLoading } = useChatContext();
  // Only use interrupted actions for interrupted threads
  const isInterrupted =
    threadData.status === "interrupted" &&
    threadData.interrupts !== undefined &&
    threadData.interrupts.length > 0;

  // Initialize the hook outside of conditional to satisfy React rules of hooks
  const actions = useInterruptedActions({
    threadData: isInterrupted
      ? {
          thread: threadData.thread,
          status: "interrupted",
          interrupts: threadData.interrupts || [],
        }
      : null,
  });

  // Safely access config for determining allowed actions
  const firstInterrupt = threadData.interrupts?.[0];
  const config = firstInterrupt?.config;
  const acceptAllowed = config?.allow_accept ?? false;

  // Handle Valid Interrupted Threads
  return (
    <div className="flex min-h-full w-full flex-col gap-9 p-12">
      {/* Header */}
      <div className="flex w-full flex-wrap items-center justify-start gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-2xl tracking-tighter text-pretty">{threadTitle}</p>
        </div>
        <ThreadIdCopyable threadId={threadData.thread.thread_id} />
      </div>

      {/* Interrupted thread actions */}
      <div className="flex w-full flex-row items-center justify-start gap-2">
        <Button
          variant="outline"
          className="border-gray-500 bg-white font-normal text-gray-800"
          onClick={actions.handleResolve}
          disabled={isLoading}
        >
          Mark as Resolved
        </Button>
      </div>

      {/* Actions */}
      <InboxItemInput
        isLoading={isLoading}
        acceptAllowed={acceptAllowed}
        hasEdited={actions.hasEdited}
        hasAddedResponse={actions.hasAddedResponse}
        interruptValue={firstInterrupt!}
        humanResponse={actions.humanResponse}
        initialValues={actions.initialHumanInterruptEditValue.current || {}}
        setHumanResponse={actions.setHumanResponse}
        supportsMultipleMethods={actions.supportsMultipleMethods}
        setSelectedSubmitType={actions.setSelectedSubmitType}
        setHasAddedResponse={actions.setHasAddedResponse}
        setHasEdited={actions.setHasEdited}
        handleSubmit={actions.handleSubmit}
      />
    </div>
  );
}
