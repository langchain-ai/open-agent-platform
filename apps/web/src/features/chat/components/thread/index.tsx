import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/features/chat/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import {
  AssistantMessage,
  AssistantMessageLoading,
} from "@/features/chat/components/thread/messages/ai";
import { HumanMessage } from "@/features/chat/components/thread/messages/human";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { ArrowDown, LoaderCircle, SquarePen } from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ensureToolCallsHaveResponses } from "@/features/chat/utils/tool-responses";
import { DO_NOT_RENDER_ID_PREFIX } from "@/constants";
import { useConfigStore } from "../../hooks/use-config-store";
import { useAuthContext } from "@/providers/Auth";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function Thread() {
  const [threadId, setThreadId] = useQueryState("threadId");
  const [agentId] = useQueryState("agentId");
  const { getAgentConfig } = useConfigStore();
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);

  const { session } = useAuthContext();

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!agentId) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
    stream.submit(
      { messages: [...toolMessages, newHumanMessage] },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          ...prev,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
        config: {
          configurable: getAgentConfig(agentId),
        },
        metadata: {
          supabaseAccessToken: session?.accessToken,
        },
      },
    );

    setInput("");
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    if (!agentId) return;

    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      config: {
        configurable: getAgentConfig(agentId),
      },
      metadata: {
        supabaseAccessToken: session?.accessToken,
      },
    });
  };

  const chatStarted = !!threadId;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      <StickToBottom className="relative flex-1 overflow-hidden">
        <StickyToBottomContent
          className={cn(
            "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
            !chatStarted && "mt-[25vh] flex flex-col items-stretch",
            chatStarted && "grid grid-rows-[1fr_auto]",
          )}
          contentClassName="pt-8 pb-16  max-w-3xl mx-auto flex flex-col gap-4 w-full"
          content={
            <>
              {messages
                .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                .map((message, index) =>
                  message.type === "human" ? (
                    <HumanMessage
                      key={message.id || `${message.type}-${index}`}
                      message={message}
                      isLoading={isLoading}
                    />
                  ) : (
                    <AssistantMessage
                      key={message.id || `${message.type}-${index}`}
                      message={message}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                    />
                  ),
                )}
              {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
              {hasNoAIOrToolMessages && !!stream.interrupt && (
                <AssistantMessage
                  key="interrupt-msg"
                  message={undefined}
                  isLoading={isLoading}
                  handleRegenerate={handleRegenerate}
                />
              )}
              {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
            </>
          }
          footer={
            <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-white">
              {!chatStarted && (
                <div className="flex items-center gap-3">
                  <LangGraphLogoSVG className="h-8 flex-shrink-0" />
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Open Agent Platform
                  </h1>
                </div>
              )}

              <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

              <div className="bg-muted relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl border shadow-xs">
                <form
                  onSubmit={handleSubmit}
                  className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.metaKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        const el = e.target as HTMLElement | undefined;
                        const form = el?.closest("form");
                        form?.requestSubmit();
                      }
                    }}
                    placeholder="Type your message..."
                    className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none"
                  />

                  <div className="flex items-center justify-between p-2 pt-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        {chatStarted && (
                          <TooltipIconButton
                            size="lg"
                            className="p-4"
                            tooltip="New thread"
                            variant="ghost"
                            onClick={() => setThreadId(null)}
                          >
                            <SquarePen className="size-5" />
                          </TooltipIconButton>
                        )}

                        <Switch
                          id="render-tool-calls"
                          checked={hideToolCalls ?? false}
                          onCheckedChange={setHideToolCalls}
                        />
                        <Label
                          htmlFor="render-tool-calls"
                          className="text-sm text-gray-600"
                        >
                          Hide Tool Calls
                        </Label>
                      </div>
                    </div>
                    {stream.isLoading ? (
                      <Button
                        key="stop"
                        onClick={() => stream.stop()}
                      >
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="shadow-md transition-all"
                        disabled={isLoading || !input.trim()}
                      >
                        Send
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          }
        />
      </StickToBottom>
    </div>
  );
}
