import { cn } from "@/lib/utils";
import {
  ActionRequest,
  HumanInterrupt,
  HumanResponseWithEdits,
  SubmitType,
} from "../types";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { haveArgsChanged, prettifyText } from "../utils";
import { MarkdownText } from "@/components/ui/markdown-text";
import { Button } from "@/components/ui/button";
import { CircleX, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "../utils/logger";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { SplitButton } from "@/components/ui/split-button";

function ResetButton({ handleReset }: { handleReset: () => void }) {
  return (
    <Button
      onClick={handleReset}
      variant="ghost"
      className="flex items-center justify-center gap-2 text-gray-500 hover:text-red-500"
    >
      <Undo2 className="h-4 w-4" />
      <span>Reset</span>
    </Button>
  );
}

function ArgsRenderer({ args }: { args: Record<string, any> }) {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      {Object.entries(args).map(([k, v]) => {
        let value = "";
        if (["string", "number"].includes(typeof v)) {
          value = v as string;
        } else {
          value = JSON.stringify(v, null);
        }

        return (
          <div
            key={`args-${k}`}
            className="flex flex-col items-start gap-1"
          >
            <p className="text-sm leading-[18px] text-wrap text-gray-600">
              {prettifyText(k)}:
            </p>
            <span className="w-full max-w-full rounded-xl bg-zinc-100 p-3 text-[13px] leading-[18px] text-black">
              <div className="text-wrap break-words break-all whitespace-pre-wrap">
                <MarkdownText>{value}</MarkdownText>
              </div>
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface InboxItemInputProps {
  interruptValue: HumanInterrupt;
  humanResponse: HumanResponseWithEdits[];
  supportsMultipleMethods: boolean;
  acceptAllowed: boolean;
  hasEdited: boolean;
  hasAddedResponse: boolean;
  initialValues: Record<string, string>;

  streaming: boolean;
  streamFinished: boolean;
  currentNode: string;

  setHumanResponse: React.Dispatch<
    React.SetStateAction<HumanResponseWithEdits[]>
  >;
  setSelectedSubmitType: React.Dispatch<
    React.SetStateAction<SubmitType | undefined>
  >;
  setHasAddedResponse: React.Dispatch<React.SetStateAction<boolean>>;
  setHasEdited: React.Dispatch<React.SetStateAction<boolean>>;

  handleSubmit: (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent,
  ) => Promise<void>;
  handleScheduledSubmit: (scheduledTime: Date) => Promise<void>;
  scheduledTime?: Date;
  setScheduledTime: (date: Date | undefined) => void;
  isScheduling: boolean;
  setIsScheduling: (value: boolean) => void;
}

function ResponseComponent({
  humanResponse,
  streaming,
  showArgsInResponse,
  interruptValue,
  onResponseChange,
  handleSubmit,
  handleSchedule,
  isScheduling,
  scheduledTime,
  setScheduledTime,
}: {
  humanResponse: HumanResponseWithEdits[];
  streaming: boolean;
  showArgsInResponse: boolean;
  interruptValue: HumanInterrupt;
  onResponseChange: (value: string, _response: HumanResponseWithEdits) => void;
  handleSubmit: (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent,
  ) => Promise<void>;
  handleSchedule: () => void;
  isScheduling: boolean;
  scheduledTime?: Date;
  setScheduledTime: (date: Date | undefined) => void;
}) {
  const res = humanResponse.find((r) => r.type === "response");
  if (!res || typeof res.args !== "string") {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-xl border-[1px] border-gray-300 p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-base font-semibold text-black">
          Respond to assistant
        </p>
        <ResetButton
          handleReset={() => {
            onResponseChange("", res);
          }}
        />
      </div>

      {showArgsInResponse && interruptValue?.action_request?.args && (
        <ArgsRenderer args={interruptValue.action_request.args} />
      )}

      <div className="flex w-full flex-col items-start gap-[6px]">
        <p className="min-w-fit text-sm font-medium">Response</p>
        <Textarea
          disabled={streaming}
          value={res.args}
          onChange={(e) => onResponseChange(e.target.value, res)}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="Your response here..."
        />
      </div>

      {isScheduling && (
        <DateTimePicker
          date={scheduledTime}
          onDateChange={setScheduledTime}
          placeholder="Select date and time..."
        />
      )}

      <div className="flex w-full items-center justify-end gap-0">
        <SplitButton
          variant="brand"
          size="default"
          buttons={[
            {
              label: "Send Response",
              onClick: handleSubmit,
              disabled: streaming,
            },
            {
              label: isScheduling ? "Schedule" : "Schedule Task",
              onClick: handleSchedule,
              disabled: streaming,
            },
          ]}
        />
      </div>
    </div>
  );
}
const Response = React.memo(ResponseComponent);

function AcceptComponent({
  streaming,
  actionRequestArgs,
  handleSubmit,
  handleSchedule,
  isScheduling,
  scheduledTime,
  setScheduledTime,
}: {
  streaming: boolean;
  actionRequestArgs: Record<string, any>;
  handleSubmit: (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent,
  ) => Promise<void>;
  handleSchedule: () => void;
  isScheduling: boolean;
  scheduledTime?: Date;
  setScheduledTime: (date: Date | undefined) => void;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-lg border-[1px] border-gray-300 p-6">
      {actionRequestArgs && Object.keys(actionRequestArgs).length > 0 && (
        <ArgsRenderer args={actionRequestArgs} />
      )}
      {isScheduling && (
        <DateTimePicker
          date={scheduledTime}
          onDateChange={setScheduledTime}
          placeholder="Select date and time..."
        />
      )}
      <div className="flex w-full items-center justify-end gap-0">
        <SplitButton
          variant="brand"
          size="default"
          buttons={[
            { label: "Accept", onClick: handleSubmit, disabled: streaming },
            {
              label: isScheduling ? "Schedule" : "Schedule Task",
              onClick: handleSchedule,
              disabled: streaming,
            },
          ]}
        />
      </div>
    </div>
  );
}

function EditAndOrAcceptComponent({
  humanResponse,
  streaming,
  initialValues,
  onEditChange,
  handleSubmit,
  interruptValue,
  handleSchedule,
  isScheduling,
  scheduledTime,
  setScheduledTime,
}: {
  humanResponse: HumanResponseWithEdits[];
  streaming: boolean;
  initialValues: Record<string, string>;
  interruptValue: HumanInterrupt;
  onEditChange: (
    _text: string | string[],
    _response: HumanResponseWithEdits,
    _key: string | string[],
  ) => void;
  handleSubmit: (
    _e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.KeyboardEvent,
  ) => Promise<void>;
  handleSchedule: () => void;
  isScheduling: boolean;
  scheduledTime?: Date;
  setScheduledTime: (date: Date | undefined) => void;
}) {
  const defaultRows = React.useRef<Record<string, number>>({});
  const editResponse = humanResponse.find((r) => r.type === "edit");
  const acceptResponse = humanResponse.find((r) => r.type === "accept");
  if (
    !editResponse ||
    typeof editResponse.args !== "object" ||
    !editResponse.args
  ) {
    if (acceptResponse) {
      return (
        <AcceptComponent
          actionRequestArgs={interruptValue?.action_request?.args || {}}
          streaming={streaming}
          handleSubmit={handleSubmit}
          handleSchedule={handleSchedule}
          isScheduling={isScheduling}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
        />
      );
    }
    return null;
  }
  const header = editResponse.acceptAllowed ? "Edit/Accept" : "Edit";
  let buttonText = "Submit";
  if (editResponse.acceptAllowed && !editResponse.editsMade) {
    buttonText = "Accept";
  }

  const handleReset = () => {
    if (
      !editResponse ||
      typeof editResponse.args !== "object" ||
      !editResponse.args ||
      !editResponse.args.args
    ) {
      return;
    }
    // use initialValues to reset the text areas
    const keysToReset: string[] = [];
    const valuesToReset: string[] = [];
    Object.entries(initialValues).forEach(([k, v]) => {
      if (k in (editResponse.args as Record<string, any>).args) {
        const value = ["string", "number"].includes(typeof v)
          ? v
          : JSON.stringify(v, null);
        keysToReset.push(k);
        valuesToReset.push(value);
      }
    });

    if (keysToReset.length > 0 && valuesToReset.length > 0) {
      onEditChange(valuesToReset, editResponse, keysToReset);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-lg border-[1px] border-gray-300 p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-base font-semibold text-black">{header}</p>
        <ResetButton handleReset={handleReset} />
      </div>

      {Object.entries(editResponse.args.args).map(([k, v], idx) => {
        const value = ["string", "number"].includes(typeof v)
          ? v
          : JSON.stringify(v, null);
        // Calculate the default number of rows by the total length of the initial value divided by 30
        // or 8, whichever is greater. Stored in a ref to prevent re-rendering.
        if (
          defaultRows.current[k as keyof typeof defaultRows.current] ===
          undefined
        ) {
          defaultRows.current[k as keyof typeof defaultRows.current] = !v.length
            ? 3
            : Math.max(v.length / 30, 7);
        }
        const numRows =
          defaultRows.current[k as keyof typeof defaultRows.current] || 8;

        return (
          <div
            className="flex h-full w-full flex-col items-start gap-1 px-[1px]"
            key={`allow-edit-args--${k}-${idx}`}
          >
            <div className="flex w-full flex-col items-start gap-[6px]">
              <p className="min-w-fit text-sm font-medium">{prettifyText(k)}</p>
              <Textarea
                disabled={streaming}
                className="h-full"
                value={value}
                onChange={(e) => onEditChange(e.target.value, editResponse, k)}
                onKeyDown={handleKeyDown}
                rows={numRows}
              />
            </div>
          </div>
        );
      })}

      {isScheduling && (
        <DateTimePicker
          date={scheduledTime}
          onDateChange={setScheduledTime}
          placeholder="Select date and time..."
        />
      )}

      <div className="flex w-full items-center justify-end gap-0">
        <SplitButton
          variant="brand"
          size="default"
          buttons={[
            { label: buttonText, onClick: handleSubmit, disabled: streaming },
            {
              label: isScheduling ? "Schedule" : "Schedule Task",
              onClick: handleSchedule,
              disabled: streaming,
            },
          ]}
        />
      </div>
    </div>
  );
}
const EditAndOrAccept = React.memo(EditAndOrAcceptComponent);

export function InboxItemInput({
  interruptValue,
  humanResponse,
  streaming,
  streamFinished,
  currentNode,
  supportsMultipleMethods,
  acceptAllowed,
  hasEdited,
  hasAddedResponse,
  initialValues,
  setHumanResponse,
  setSelectedSubmitType,
  setHasEdited,
  setHasAddedResponse,
  handleSubmit,
  handleScheduledSubmit,
  scheduledTime,
  setScheduledTime,
  isScheduling,
  setIsScheduling,
}: InboxItemInputProps) {
  const isEditAllowed = interruptValue?.config?.allow_edit ?? false;
  const isResponseAllowed = interruptValue?.config?.allow_respond ?? false;
  const hasArgs =
    Object.entries(interruptValue?.action_request?.args || {}).length > 0;
  const showArgsInResponse =
    hasArgs && !isEditAllowed && !acceptAllowed && isResponseAllowed;
  const showArgsOutsideActionCards =
    hasArgs && !showArgsInResponse && !isEditAllowed && !acceptAllowed;
  const isError = currentNode === "__error__";

  // Track which section is currently scheduling to scope the date picker
  const [schedulingSection, setSchedulingSection] = React.useState<
    "edit" | "response" | "accept" | undefined
  >(undefined);

  const onEditChange = (
    change: string | string[],
    response: HumanResponseWithEdits,
    key: string | string[],
  ) => {
    if (
      (Array.isArray(change) && !Array.isArray(key)) ||
      (!Array.isArray(change) && Array.isArray(key))
    ) {
      toast.error("Something went wrong", { richColors: true });
      return;
    }

    let valuesChanged = true;
    if (typeof response.args === "object") {
      const updatedArgs = { ...(response.args?.args || {}) };

      if (Array.isArray(change) && Array.isArray(key)) {
        // Handle array inputs by mapping corresponding values
        change.forEach((value, index) => {
          if (index < key.length) {
            updatedArgs[key[index]] = value;
          }
        });
      } else {
        // Handle single value case
        updatedArgs[key as string] = change as string;
      }

      const haveValuesChanged = haveArgsChanged(updatedArgs, initialValues);
      valuesChanged = haveValuesChanged;
    }

    if (!valuesChanged) {
      setHasEdited(false);
      if (acceptAllowed) {
        setSelectedSubmitType("accept");
      } else if (hasAddedResponse) {
        setSelectedSubmitType("response");
      }
    } else {
      setSelectedSubmitType("edit");
      setHasEdited(true);
    }

    setHumanResponse((prev) => {
      if (typeof response.args !== "object" || !response.args) {
        logger.error(
          "Mismatched response type",
          !!response.args,
          typeof response.args,
        );
        return prev;
      }

      const newEdit: HumanResponseWithEdits = {
        type: response.type,
        args: {
          action: response.args.action,
          args:
            Array.isArray(change) && Array.isArray(key)
              ? {
                  ...response.args.args,
                  ...Object.fromEntries(key.map((k, i) => [k, change[i]])),
                }
              : {
                  ...response.args.args,
                  [key as string]: change as string,
                },
        },
      };
      if (
        prev.find(
          (p) =>
            p.type === response.type &&
            typeof p.args === "object" &&
            p.args?.action === (response.args as ActionRequest).action,
        )
      ) {
        return prev.map((p) => {
          if (
            p.type === response.type &&
            typeof p.args === "object" &&
            p.args?.action === (response.args as ActionRequest).action
          ) {
            if (p.acceptAllowed) {
              return {
                ...newEdit,
                acceptAllowed: true,
                editsMade: valuesChanged,
              };
            }

            return newEdit;
          }
          return p;
        });
      } else {
        throw new Error("No matching response found");
      }
    });
  };

  const onResponseChange = (
    change: string,
    response: HumanResponseWithEdits,
  ) => {
    if (!change) {
      setHasAddedResponse(false);
      if (hasEdited) {
        // The user has deleted their response, so we should set the submit type to
        // `edit` if they've edited, or `accept` if it's allowed and they have not edited.
        setSelectedSubmitType("edit");
      } else if (acceptAllowed) {
        setSelectedSubmitType("accept");
      }
    } else {
      setSelectedSubmitType("response");
      setHasAddedResponse(true);
    }

    setHumanResponse((prev) => {
      const newResponse: HumanResponseWithEdits = {
        type: response.type,
        args: change,
      };

      if (prev.find((p) => p.type === response.type)) {
        return prev.map((p) => {
          if (p.type === response.type) {
            if (p.acceptAllowed) {
              return {
                ...newResponse,
                acceptAllowed: true,
                editsMade: !!change,
              };
            }
            return newResponse;
          }
          return p;
        });
      } else {
        throw new Error("No human response found for string response");
      }
    });
  };

  const baseHandleSchedule = React.useCallback(async () => {
    if (!isScheduling) {
      setIsScheduling(true);
      return;
    }
    if (!scheduledTime) {
      toast("Please select a date and time", {
        description: "Choose a future time to schedule this action.",
        duration: 4000,
      });
      return;
    }
    try {
      await handleScheduledSubmit(scheduledTime);
      setIsScheduling(false);
      setScheduledTime(undefined);
      setSchedulingSection(undefined);
    } catch {
      // Error toast is handled in the action hook
    }
  }, [
    isScheduling,
    scheduledTime,
    handleScheduledSubmit,
    setIsScheduling,
    setScheduledTime,
  ]);

  const handleScheduleEdit = React.useCallback(async () => {
    if (!isScheduling) {
      setSchedulingSection("edit");
    }
    await baseHandleSchedule();
  }, [isScheduling, baseHandleSchedule]);

  const handleScheduleResponse = React.useCallback(async () => {
    if (!isScheduling) {
      setSchedulingSection("response");
    }
    await baseHandleSchedule();
  }, [isScheduling, baseHandleSchedule]);

  return (
    <div
      className={cn(
        "flex w-full flex-col items-start justify-start gap-2 shadow-sm",
        "",
      )}
    >
      {showArgsOutsideActionCards && interruptValue?.action_request?.args && (
        <ArgsRenderer args={interruptValue.action_request.args} />
      )}

      <div className="flex w-full flex-col items-start gap-2">
        <EditAndOrAccept
          humanResponse={humanResponse}
          streaming={streaming}
          initialValues={initialValues}
          interruptValue={interruptValue}
          onEditChange={onEditChange}
          handleSubmit={handleSubmit}
          handleSchedule={handleScheduleEdit}
          isScheduling={isScheduling && schedulingSection === "edit"}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
        />
        {supportsMultipleMethods ? (
          <div className="mt-4 mb-2 flex w-full items-center justify-center">
            <p className="text-xs text-gray-400">or</p>
          </div>
        ) : null}
        {isResponseAllowed && (
          <Response
            humanResponse={humanResponse}
            streaming={streaming}
            showArgsInResponse={showArgsInResponse}
            interruptValue={interruptValue}
            onResponseChange={onResponseChange}
            handleSubmit={handleSubmit}
            handleSchedule={handleScheduleResponse}
            isScheduling={isScheduling && schedulingSection === "response"}
            scheduledTime={scheduledTime}
            setScheduledTime={setScheduledTime}
          />
        )}
        {streaming && !currentNode && (
          <p className="text-sm text-gray-600">Waiting for Graph to start...</p>
        )}
        {streaming && currentNode && !isError && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
            <span className="text-sm text-gray-600">
              Running:{" "}
              <span className="font-medium text-gray-700">
                {prettifyText(currentNode)}
              </span>
            </span>
          </div>
        )}
        {streaming && currentNode && isError && (
          <div className="flex items-center justify-start gap-1 text-sm text-red-500">
            <p>Error occurred</p>
            <CircleX className="h-3 w-3 text-red-500" />
          </div>
        )}
        {streamFinished && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-700">
              Successfully completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}