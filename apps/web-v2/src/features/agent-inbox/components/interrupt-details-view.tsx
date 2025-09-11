import { ThreadData } from "@/types/inbox";
import { GenericInterruptValue } from "./generic-interrupt-value";

// InterruptDetailsView component
export function InterruptDetailsView({
  threadData,
}: {
  threadData: ThreadData<any>;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      {threadData.thread.interrupts &&
      Object.entries(threadData.thread.interrupts).length > 0 ? (
        Object.entries(threadData.thread.interrupts).map(
          ([interruptId, values]) => (
            <GenericInterruptValue
              key={interruptId}
              interrupt={values?.[values?.length - 1]?.value}
              id={interruptId}
            />
          ),
        )
      ) : (
        <div className="text-sm text-gray-500">No interrupt data available</div>
      )}
    </div>
  );
}
