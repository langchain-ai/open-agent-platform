import { cn } from "@/lib/utils";
import { Thread } from "@langchain/langgraph-sdk";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemStatuses } from "./statuses";
import { format } from "date-fns";
import { useQueryState, parseAsString } from "nuqs";
import {
  STUDIO_NOT_WORKING_TROUBLESHOOTING_URL,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { GenericThreadData } from "@/types/inbox";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { constructOpenInStudioURL } from "../utils";

interface GenericInboxItemProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData:
    | GenericThreadData<ThreadValues>
    | {
        thread: Thread<ThreadValues>;
        status: "interrupted";
        interrupts?: undefined;
      };
  isLast: boolean;
}

export function GenericInboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, isLast }: GenericInboxItemProps<ThreadValues>) {
  const [, setSelectedThreadIdParam] = useQueryState(
    VIEW_STATE_THREAD_QUERY_PARAM,
    parseAsString,
  );
  const [agentInboxId] = useQueryState("agentInbox");

  const handleOpenInStudio = () => {
    if (!agentInboxId) {
      toast.error("No agent inbox selected.", {
        duration: 5000,
        richColors: true,
      });
      return;
    }

    const [assistantId, deploymentId] = agentInboxId.split(":");

    const studioUrl = constructOpenInStudioURL(
      assistantId,
      deploymentId,
      threadData.thread.thread_id,
    );

    if (studioUrl === "#") {
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
          richColors: true,
        },
      );
    } else {
      window.open(studioUrl, "_blank");
    }
  };

  const updatedAtDateString = format(
    new Date(threadData.thread.updated_at),
    "MM/dd h:mm a",
  );

  return (
    <div
      onClick={() => setSelectedThreadIdParam(threadData.thread.thread_id)}
      className={cn(
        "grid h-[71px] w-full cursor-pointer grid-cols-12 p-4 py-4.5 transition-colors ease-in-out hover:bg-gray-50/90",
        !isLast && "border-b-[1px] border-gray-200",
      )}
    >
      <div className="col-span-1 flex items-center justify-center">
        {/* Empty space for alignment with interrupted items */}
      </div>

      <div
        className={cn(
          "col-span-6 flex items-center justify-start gap-2",
          !agentInboxId && "col-span-9",
        )}
      >
        <p className="text-sm font-semibold text-black">Thread ID:</p>
        <ThreadIdCopyable
          showUUID
          threadId={threadData.thread.thread_id}
        />
      </div>

      {agentInboxId && (
        <div className="col-span-2 flex items-center">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 bg-white"
            onClick={handleOpenInStudio}
          >
            Studio
          </Button>
        </div>
      )}

      <div
        className={cn(
          "col-span-2 flex items-center",
          !agentInboxId && "col-start-10",
        )}
      >
        <InboxItemStatuses status={threadData.status} />
      </div>

      <p className="col-span-1 pt-2 text-right text-sm font-light text-gray-600">
        {updatedAtDateString}
      </p>
    </div>
  );
}
