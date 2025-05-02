import { useEffect, useState } from "react";
import { HumanInterrupt } from "./interrupt-types";
import { StateView } from "@/components/agent-inbox/components/state-view";
import { ThreadActionsView } from "@/components/agent-inbox/components/thread-actions-view";
import { ThreadData } from "@/components/agent-inbox/types";
import { useQueryState } from "nuqs";
import { useStreamContext } from "@/features/chat/providers/Stream";

interface ThreadViewChatProps {
  interrupt: HumanInterrupt | HumanInterrupt[];
}

export function ThreadViewChat({ interrupt }: ThreadViewChatProps) {
  const thread = useStreamContext();
  const [showDescription, setShowDescription] = useState(false);
  const [showState, setShowState] = useState(false);
  const showSidePanel = showDescription || showState;
  const [threadId] = useQueryState("threadId");
  const [threadData, setThreadData] = useState<ThreadData>();

  useEffect(() => {
    if (!threadId) {
      return;
    }
    thread.client.threads.get(threadId).then((thread) => {
      setThreadData({
        thread,
        interrupts: Array.isArray(interrupt) ? interrupt : [interrupt],
        status: "interrupted",
      });
    });
  }, [interrupt, threadId]);

  const handleShowSidePanel = (
    showState: boolean,
    showDescription: boolean,
  ) => {
    if (showState && showDescription) {
      console.error("Cannot show both state and description");
      return;
    }
    if (showState) {
      setShowDescription(false);
      setShowState(true);
    } else if (showDescription) {
      setShowState(false);
      setShowDescription(true);
    } else {
      setShowState(false);
      setShowDescription(false);
    }
  };

  if (!threadData) {
    return null;
  }

  return (
    <div className="flex h-[80vh] w-full flex-col overflow-y-scroll rounded-2xl bg-gray-50/50 p-8 lg:flex-row [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {showSidePanel ? (
        <StateView
          handleShowSidePanel={handleShowSidePanel}
          threadData={threadData}
          view={showState ? "state" : "description"}
        />
      ) : (
        <ThreadActionsView
          threadData={threadData}
          isInterrupted={true}
          handleShowSidePanel={handleShowSidePanel}
          showState={showState}
          showDescription={showDescription}
          setThreadData={setThreadData}
        />
      )}
    </div>
  );
}
