import { ThreadData, InterruptedThreadData } from "@/types/inbox";
import { useQueryState, parseAsString } from "nuqs";
import { InterruptedInboxItem } from "./interrupted-inbox-item";
import { GenericInboxItem } from "./generic-inbox-item";
import { INBOX_PARAM } from "../constants";

interface InboxItemProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  isLast: boolean;
  onThreadClick?: (id: string) => void;
}

export function InboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, isLast, onThreadClick }: InboxItemProps<ThreadValues>) {
  const [selectedInbox] = useQueryState(
    INBOX_PARAM,
    parseAsString.withDefault("interrupted"),
  );

  if (selectedInbox === "all") {
    if (threadData.status === "interrupted") {
      const interruptedData = threadData as InterruptedThreadData<ThreadValues>;
      if (interruptedData.interrupts?.length) {
        return (
          <InterruptedInboxItem
            threadData={interruptedData}
            isLast={isLast}
            onThreadClick={onThreadClick || (() => {})}
          />
        );
      } else {
        return (
          <GenericInboxItem
            threadData={{
              thread: interruptedData.thread,
              status: "interrupted",
              interrupts: undefined,
            }}
            isLast={isLast}
          />
        );
      }
    } else {
      // Convert human_response_needed to idle for GenericInboxItem
      const adaptedStatus =
        threadData.status === "human_response_needed"
          ? "idle"
          : threadData.status;

      return (
        <GenericInboxItem
          threadData={{
            thread: threadData.thread,
            status: adaptedStatus,
          }}
          isLast={isLast}
        />
      );
    }
  }

  if (selectedInbox === "interrupted" && threadData.status === "interrupted") {
    const interruptedData = threadData as InterruptedThreadData<ThreadValues>;
    if (interruptedData.interrupts?.length) {
      return (
        <InterruptedInboxItem
          threadData={interruptedData}
          isLast={isLast}
          onThreadClick={onThreadClick || (() => {})}
        />
      );
    } else {
      return (
        <GenericInboxItem
          threadData={{
            thread: interruptedData.thread,
            status: "interrupted",
            interrupts: undefined,
          }}
          isLast={isLast}
        />
      );
    }
  }

  if (selectedInbox !== "interrupted" && threadData.status !== "interrupted") {
    // Convert human_response_needed to idle for GenericInboxItem
    const adaptedStatus =
      threadData.status === "human_response_needed"
        ? "idle"
        : threadData.status;

    return (
      <GenericInboxItem
        threadData={{
          thread: threadData.thread,
          status: adaptedStatus,
        }}
        isLast={isLast}
      />
    );
  }

  return null;
}
