import { cn } from "@/lib/utils";
import { HumanInterruptConfig } from "@/types/inbox";
import { prettifyText } from "../utils";

export function InboxItemStatuses({
  config,
  status,
}: {
  config?: HumanInterruptConfig;
  status?: "idle" | "busy" | "error" | "interrupted" | "human_response_needed";
}) {
  if (!config && !status) {
    throw new Error("Either config or status must be provided");
  }
  if (config && status) {
    throw new Error("Only one of config or status can be provided");
  }

  if (config) {
    const isOnlyIgnoreAllowed =
      config.allow_ignore &&
      !config.allow_respond &&
      !config.allow_edit &&
      !config.allow_accept;

    return (
      <div
        className={cn(
          "flex w-fit items-center justify-center rounded-full border-[1.5px] px-2 py-[2px] font-medium text-nowrap",
          "transition-colors ease-in-out hover:bg-gray-50/90",
          isOnlyIgnoreAllowed
            ? "border-gray-600 text-gray-600"
            : "border-green-700 text-green-700",
        )}
      >
        <div className="flex items-center justify-center gap-2 text-sm">
          <div
            className={cn(
              "h-[6px] w-[6px] rounded-full",
              isOnlyIgnoreAllowed ? "bg-gray-600" : "bg-green-700",
            )}
          />
          <span>{isOnlyIgnoreAllowed ? "Ignore" : "Requires Action"}</span>
        </div>
      </div>
    );
  } else if (status) {
    return (
      <div
        className={cn(
          "flex w-fit items-center justify-center rounded-full border-[2px] px-2 py-[2px] font-medium text-nowrap",
          status === "idle" && "border-gray-600 text-gray-600",
          status === "busy" && "border-yellow-600 text-yellow-600",
          status === "error" && "border-red-600 text-red-600",
          status === "interrupted" && "border-green-700 text-green-700",
          status === "human_response_needed" && "border-blue-600 text-blue-600",
        )}
      >
        <p className="text-sm">{prettifyText(status)}</p>
      </div>
    );
  }

  return null;
}
