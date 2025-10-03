import { useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import useInterruptedActions from "./hooks/use-interrupted-actions";
import { ThreadIdCopyable } from "./components/thread-id";
import { InboxItemInput } from "./components/inbox-item-input";
import { useChatContext } from "../../providers/ChatProvider";
import { Interrupt } from "@langchain/langgraph-sdk";
import { HumanInterrupt } from "./types";
import { HumanResponse } from "../../types/inbox";
import { getInterruptTitle } from "./utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ThreadActionsViewProps {
  interrupt: Interrupt;
  threadId: string | null;
  onCurrentInterruptChange?: (index: number, interrupt: HumanInterrupt) => void;
  externalResponses?: Map<number, HumanResponse>;
}

// Wrapper component for each interrupt item in carousel
function InterruptItemWrapper({
  interruptItem,
  index,
  isLoading,
  onSubmit,
}: {
  interruptItem: HumanInterrupt;
  index: number;
  isLoading: boolean;
  onSubmit: (response: HumanResponse) => void;
}) {
  // Create a mock interrupt object for this single item
  const mockInterrupt = {
    value: [interruptItem],
  } as Interrupt;

  const actions = useInterruptedActions({
    interrupt: mockInterrupt,
  });

  return (
    <InboxItemInput
      isLoading={isLoading}
      acceptAllowed={interruptItem?.config?.allow_accept ?? false}
      hasEdited={actions.hasEdited}
      hasAddedResponse={actions.hasAddedResponse}
      interruptValue={interruptItem}
      humanResponse={actions.humanResponse}
      initialValues={actions.initialHumanInterruptEditValue.current || {}}
      setHumanResponse={actions.setHumanResponse}
      supportsMultipleMethods={actions.supportsMultipleMethods}
      setSelectedSubmitType={actions.setSelectedSubmitType}
      setHasAddedResponse={actions.setHasAddedResponse}
      setHasEdited={actions.setHasEdited}
      handleSubmit={(e) => {
        e?.preventDefault();
        const selectedType = actions.selectedSubmitType;
        const response = actions.humanResponse.find(
          (r) => r.type === selectedType,
        );

        if (!response) {
          toast.error("No response selected.");
          return;
        }

        const args = response.args;
        if (
          response.type === "edit" &&
          "acceptAllowed" in response &&
          response.acceptAllowed &&
          !("editsMade" in response && response.editsMade)
        ) {
          // Convert to accept if no edits were made
          onSubmit({ type: "accept", args });
        } else {
          onSubmit({ type: response.type, args });
        }
      }}
    />
  );
}

export function ThreadActionsView({
  interrupt,
  threadId,
  onCurrentInterruptChange,
  externalResponses,
}: ThreadActionsViewProps) {
  const { isLoading, sendHumanResponse } = useChatContext();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Get all interrupts from the interrupt value array
  const interrupts = (interrupt.value as any[]) || [];
  const hasMultipleInterrupts = interrupts.length > 1;

  const interruptValue = interrupts[current] as HumanInterrupt;

  const threadTitle = getInterruptTitle(interrupt);

  // For single interrupt, use the hook
  // For multiple interrupts, we'll manage state locally
  const singleInterrupt = !hasMultipleInterrupts ? interrupt : null;
  const actions = useInterruptedActions({
    interrupt: singleInterrupt!,
  });

  // Check if all interrupts allow accept (for Accept All button)
  const allAllowAccept = interrupts.every(
    (int: HumanInterrupt) => int.config?.allow_accept,
  );

  // Update current index when carousel changes
  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Notify parent of current interrupt change
  useEffect(() => {
    if (onCurrentInterruptChange && interruptValue) {
      onCurrentInterruptChange(current, interruptValue);
    }
  }, [current, onCurrentInterruptChange]);

  // Handle Accept All
  const handleAcceptAll = useCallback(() => {
    if (!hasMultipleInterrupts) return;

    try {
      const allResponses = interrupts.map((int: HumanInterrupt) => ({
        type: "accept" as const,
        args: int.action_request,
      }));

      sendHumanResponse(allResponses);

      toast.success("All interrupts accepted successfully.", {
        duration: 5000,
      });
    } catch (e) {
      console.error("Error accepting all interrupts", e);
      toast.error("Failed to accept all interrupts.", {
        duration: 5000,
      });
    }
  }, [interrupts, hasMultipleInterrupts, sendHumanResponse]);

  // Track which interrupts have been addressed and their responses
  const [addressedInterrupts, setAddressedInterrupts] = useState<
    Map<number, HumanResponse>
  >(new Map());

  const allInterruptsAddressed =
    hasMultipleInterrupts && addressedInterrupts.size === interrupts.length;

  // Sync external responses (from chat input) with local state
  useEffect(() => {
    if (externalResponses) {
      setAddressedInterrupts(externalResponses);
    }
  }, [externalResponses]);

  // Submit all addressed interrupts
  const handleSubmitAll = useCallback(() => {
    if (!allInterruptsAddressed) {
      toast.error(
        `Please address all ${interrupts.length} interrupts before submitting.`,
        {
          duration: 5000,
        },
      );
      return;
    }

    try {
      // Collect responses in order
      const allResponses = interrupts.map(
        (_: HumanInterrupt, index: number) => {
          const response = addressedInterrupts.get(index);
          if (!response) {
            throw new Error(`Missing response for interrupt ${index + 1}`);
          }
          return response;
        },
      );

      sendHumanResponse(allResponses);

      toast.success("All interrupts submitted successfully.", {
        duration: 5000,
      });

      setAddressedInterrupts(new Map());
    } catch (e) {
      console.error("Error submitting all interrupts", e);
      toast.error("Failed to submit interrupts.", {
        duration: 5000,
      });
    }
  }, [
    allInterruptsAddressed,
    interrupts,
    addressedInterrupts,
    sendHumanResponse,
  ]);

  // Handle Valid Interrupted Threads
  return (
    <div className="flex w-full flex-col gap-4">
      {/* Header */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-2xl tracking-tighter text-pretty">{threadTitle}</p>
          {threadId && <ThreadIdCopyable threadId={threadId} />}
        </div>
        {hasMultipleInterrupts && allAllowAccept && (
          <Button
            onClick={handleAcceptAll}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Accept All
          </Button>
        )}
      </div>

      {/* Progress indicator for multiple interrupts */}
      {hasMultipleInterrupts && (
        <div className="flex items-center gap-2">
          {interrupts.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-colors ${
                addressedInterrupts.has(index)
                  ? "bg-green-500"
                  : index === current
                    ? "bg-gray-400"
                    : "border border-gray-300 bg-white"
              }`}
            />
          ))}
        </div>
      )}

      {/* Carousel for multiple interrupts */}
      {hasMultipleInterrupts ? (
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">
            Interrupt {current + 1} of {interrupts.length}
          </div>
          <Carousel
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent>
              {interrupts.map(
                (interruptItem: HumanInterrupt, index: number) => {
                  const isAddressed = addressedInterrupts.has(index);
                  const addressedResponse = addressedInterrupts.get(index);

                  return (
                    <CarouselItem key={index}>
                      <div className="space-y-3">
                        {/* Show addressed status if already responded */}
                        {isAddressed && (
                          <div
                            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                              addressedResponse?.type === "response"
                                ? "border-gray-200 bg-gray-50 text-gray-700"
                                : "border-green-200 bg-green-50 text-green-700"
                            }`}
                          >
                            {addressedResponse?.type === "accept" ? (
                              <>
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div className="font-medium">Accepted</div>
                              </>
                            ) : addressedResponse?.type === "response" ? (
                              <>
                                <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div>
                                  <div className="mb-0.5 text-xs font-medium">
                                    Response provided:
                                  </div>
                                  <div className="text-gray-800">
                                    {typeof addressedResponse.args === "string"
                                      ? addressedResponse.args
                                      : JSON.stringify(addressedResponse.args)}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <div className="font-medium">Edited</div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Show InboxItemInput for each interrupt */}
                        <InterruptItemWrapper
                          interruptItem={interruptItem}
                          index={index}
                          isLoading={isLoading}
                          onSubmit={(response) => {
                            setAddressedInterrupts((prev) => {
                              const updated = new Map(prev);
                              updated.set(index, response);
                              return updated;
                            });
                            toast.success(`Interrupt ${index + 1} addressed.`, {
                              duration: 3000,
                            });
                          }}
                        />
                      </div>
                    </CarouselItem>
                  );
                },
              )}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>

          {/* Submit All Button */}
          {allInterruptsAddressed && (
            <Button
              onClick={handleSubmitAll}
              disabled={isLoading}
              className="w-full gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Submit All {interrupts.length} Responses
            </Button>
          )}
        </div>
      ) : (
        <InboxItemInput
          isLoading={isLoading}
          acceptAllowed={interruptValue?.config?.allow_accept ?? false}
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
      )}
    </div>
  );
}
