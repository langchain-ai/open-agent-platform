import { cn } from "@/lib/utils";
import { InterruptedThreadData } from "../types";
import React from "react";
import { InboxItemStatuses } from "./statuses";
import { format } from "date-fns";
import { useQueryState, parseAsString } from "nuqs";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { IMPROPER_SCHEMA } from "@/constants";
import { ThreadIdCopyable } from "./thread-id";

interface InterruptedInboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: InterruptedThreadData<ThreadValues>;
  isLast: boolean;
  onThreadClick: (id: string) => void;
}

export const InterruptedInboxItem = <ThreadValues extends Record<string, any>>({
  threadData,
  isLast,
  onThreadClick,
}: InterruptedInboxItem<ThreadValues>) => {
  const [, setSelectedThreadIdParam] = useQueryState(
    VIEW_STATE_THREAD_QUERY_PARAM,
    parseAsString,
  );
  const firstInterrupt = threadData.interrupts?.[0];

  const descriptionPreview = firstInterrupt?.description?.slice(0, 65);
  const descriptionTruncated =
    firstInterrupt?.description && firstInterrupt.description.length > 65;

  const action = firstInterrupt?.action_request?.action;
  const title = !action || action === IMPROPER_SCHEMA ? "Interrupt" : action;
  const hasNoDescription =
    !firstInterrupt ||
    (!firstInterrupt.description && !threadData.invalidSchema);

  const updatedAtDateString = format(
    new Date(threadData.thread.updated_at),
    "MM/dd h:mm a",
  );

  const handleThreadClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Call the onThreadClick callback first to save scroll position
    if (onThreadClick) {
      onThreadClick(threadData.thread.thread_id);
    }

    // Add await here
    await setSelectedThreadIdParam(threadData.thread.thread_id);
  };

  const hasDescriptionValue =
    descriptionPreview ||
    descriptionTruncated ||
    (!firstInterrupt && threadData.invalidSchema);

  return (
    <div
      key={threadData.thread.thread_id}
      onClick={handleThreadClick}
      className={cn(
        "grid h-[71px] w-full cursor-pointer grid-cols-12 items-center p-4 transition-colors ease-in-out hover:bg-gray-50/90",
        !isLast && "border-b border-gray-200",
      )}
    >
      {/* Column 1: Dot - adjusted span slightly */}
      <div className="col-span-1 flex justify-center">
        <div className="h-[6px] w-[6px] rounded-full bg-blue-400" />
      </div>

      {/* Column 2-9: Title and Description - merged spans */}
      <div className="col-span-8 overflow-hidden">
        <div className="flex items-center">
          <span className="truncate pr-1 text-sm font-semibold text-black">
            {title}
          </span>

          {threadData.invalidSchema && (
            <div className="ml-2">
              <ThreadIdCopyable
                showUUID
                threadId={threadData.thread.thread_id}
              />
            </div>
          )}
        </div>
        {hasDescriptionValue && (
          <div className="text-muted-foreground h-[18px] truncate text-sm">
            {descriptionPreview}
            {descriptionTruncated && "..."}
            {!firstInterrupt && threadData.invalidSchema && (
              <i>Invalid interrupt data - cannot display details.</i>
            )}
            {hasNoDescription && <span>&nbsp;</span>}
          </div>
        )}
      </div>

      {/* Column 10: Statuses - adjusted span */}
      <div className="col-span-1">
        {firstInterrupt?.config && (
          <InboxItemStatuses config={firstInterrupt.config} />
        )}
      </div>

      {/* Column 11-12: Timestamp - adjusted span */}
      <p className="col-span-2 text-right text-sm font-light text-gray-600">
        {updatedAtDateString}
      </p>
    </div>
  );
};
