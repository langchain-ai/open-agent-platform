import {
  HumanResponse,
  HumanResponseWithEdits,
  SubmitType,
} from "../../../types/inbox";
import { toast } from "sonner";
import React, { FormEvent } from "react";
import { createDefaultHumanResponse } from "../utils";

import { useQueryState } from "nuqs";
import { useChatContext } from "../../../providers/ChatProvider";
import { Interrupt } from "@langchain/langgraph-sdk";

interface UseInterruptedActionsInput {
  interrupt: Interrupt | undefined;
}

interface UseInterruptedActionsValue {
  // Actions
  handleSubmit: (
    e?:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.KeyboardEvent
      | FormEvent,
  ) => void;
  handleResolve: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;

  // State values
  supportsMultipleMethods: boolean;
  selectedSubmitType: SubmitType | undefined;
  hasEdited: boolean;
  hasAddedResponse: boolean;
  acceptAllowed: boolean;
  humanResponse: HumanResponseWithEdits[];

  // State setters
  setSelectedSubmitType: React.Dispatch<
    React.SetStateAction<SubmitType | undefined>
  >;
  setHumanResponse: React.Dispatch<
    React.SetStateAction<HumanResponseWithEdits[]>
  >;
  setHasAddedResponse: React.Dispatch<React.SetStateAction<boolean>>;
  setHasEdited: React.Dispatch<React.SetStateAction<boolean>>;

  // Refs
  initialHumanInterruptEditValue: React.MutableRefObject<
    Record<string, string>
  >;

  // Utils
  resetState: () => void;
}

export default function useInterruptedActions({
  interrupt,
}: UseInterruptedActionsInput): UseInterruptedActionsValue {
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");

  const { sendHumanResponse, markCurrentThreadAsResolved } = useChatContext();

  const [humanResponse, setHumanResponse] = React.useState<
    HumanResponseWithEdits[]
  >([]);
  const initialHumanInterruptEditValue = React.useRef<Record<string, string>>(
    {},
  );
  const [selectedSubmitType, setSelectedSubmitType] =
    React.useState<SubmitType>();
  // Whether or not the user has edited any fields which allow editing.
  const [hasEdited, setHasEdited] = React.useState(false);
  // Whether or not the user has added a response.
  const [hasAddedResponse, setHasAddedResponse] = React.useState(false);
  const [acceptAllowed, setAcceptAllowed] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!interrupt) return;
      const interruptValue = (interrupt.value as any)?.[0];
      const { responses, defaultSubmitType, hasAccept } =
        createDefaultHumanResponse(
          [interruptValue],
          initialHumanInterruptEditValue,
        );
      setSelectedSubmitType(defaultSubmitType);
      setHumanResponse(responses);
      setAcceptAllowed(hasAccept);
    } catch (e) {
      console.error("Error formatting and setting human response state", e);
      // Set fallback values for invalid interrupts
      setHumanResponse([{ type: "ignore", args: null }]);
      setSelectedSubmitType(undefined);
      setAcceptAllowed(false);
      console.error("Error formatting and setting human response state", e);
    }
  }, [interrupt]);

  const handleSubmit = (
    e?:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.KeyboardEvent
      | FormEvent,
  ) => {
    e?.preventDefault();
    if (!agentId || !deploymentId) {
      toast.error("No agent ID or deployment ID found");
      return;
    }
    if (!humanResponse) {
      toast.error("Please enter a response.");
      return;
    }

    initialHumanInterruptEditValue.current = {};

    try {
      const humanResponseInput: HumanResponse[] = humanResponse.flatMap((r) => {
        if (r.type === "edit") {
          if (r.acceptAllowed && !r.editsMade) {
            return {
              type: "accept",
              args: r.args,
            };
          } else {
            return {
              type: "edit",
              args: r.args,
            };
          }
        }

        if (r.type === "response" && !r.args) {
          // If response was allowed but no response was given, do not include in the response
          return [];
        }
        return {
          type: r.type,
          args: r.args,
        };
      });

      const input = humanResponseInput.find(
        (r) => r.type === selectedSubmitType,
      );
      if (!input) {
        toast.error("No response found.");
        return;
      }

      sendHumanResponse([input]);

      toast.success("Response submitted successfully.", {
        duration: 5000,
      });
    } catch (e) {
      console.error("Error sending human response", e);

      toast.error("Failed to submit response.", {
        duration: 5000,
      });
    }
  };

  const handleResolve = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    if (!agentId || !deploymentId) {
      toast.error("No agent ID or deployment ID found");
      return;
    }

    initialHumanInterruptEditValue.current = {};

    markCurrentThreadAsResolved();

    toast.success("Thread marked as resolved.", {
      richColors: true,
    });
  };

  const resetState = () => {
    setHumanResponse([]);
    setSelectedSubmitType(undefined);
    setHasAddedResponse(false);
    setHasEdited(false);
  };

  return {
    handleSubmit,
    handleResolve,
    resetState,
    supportsMultipleMethods:
      humanResponse.filter(
        (r) =>
          r.type === "edit" || r.type === "accept" || r.type === "response",
      ).length > 1,
    selectedSubmitType,
    hasEdited,
    hasAddedResponse,
    acceptAllowed,
    humanResponse,
    setSelectedSubmitType,
    setHumanResponse,
    setHasAddedResponse,
    setHasEdited,
    initialHumanInterruptEditValue,
  };
}
