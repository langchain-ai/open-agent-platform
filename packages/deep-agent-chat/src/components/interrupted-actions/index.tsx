import { Button } from "../ui/button";
import { AlertCircle } from "lucide-react";
import useInterruptedActions from "./hooks/use-interrupted-actions";
import { ThreadIdCopyable } from "./components/thread-id";
import { InboxItemInput } from "./components/inbox-item-input";
import { useChatContext } from "../../providers/ChatProvider";
import { Interrupt } from "@langchain/langgraph-sdk";
import { HumanInterrupt } from "./types";

interface ThreadActionsViewProps {
  interrupt: Interrupt;
  threadId: string | null;
}

export function ThreadActionsView({
  interrupt,
  threadId,
}: ThreadActionsViewProps) {
  const { isLoading } = useChatContext();
  // Initialize the hook outside of conditional to satisfy React rules of hooks
  const actions = useInterruptedActions({
    interrupt,
  });

  const interruptValue = (interrupt.value as any)?.[0] as HumanInterrupt;

  const acceptAllowed = interruptValue?.config?.allow_accept ?? false;
  const threadTitle =
    interruptValue?.action_request.action ?? "Unknown interrupt";

  // Handle Valid Interrupted Threads
  return (
    <div className="flex w-full flex-col gap-9 p-12">
      {/* Header */}
      <div className="flex w-full flex-wrap items-center justify-start gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-2xl tracking-tighter text-pretty">{threadTitle}</p>
        </div>
        {threadId && <ThreadIdCopyable threadId={threadId} />}
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
        interruptValue={interruptValue}
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
