import { Message } from "@langchain/langgraph-sdk";

export function extractStringFromMessageContent(message: Message): string {
  return typeof message.content === "string"
    ? message.content
    : Array.isArray(message.content)
      ? message.content
          .filter(
            (c: unknown) =>
              (typeof c === "object" &&
                c !== null &&
                "type" in c &&
                (c as { type: string }).type === "text") ||
              typeof c === "string",
          )
          .map((c: unknown) =>
            typeof c === "string"
              ? c
              : typeof c === "object" && c !== null && "text" in c
                ? (c as { text?: string }).text || ""
                : "",
          )
          .join("")
      : "";
}

export function isPreparingToCallTaskTool(messages: Message[]): boolean {
  const lastMessage = messages[messages.length - 1];
  return (
    (lastMessage.type === "ai" &&
      lastMessage.tool_calls?.some(
        (call: { name?: string }) => call.name === "task",
      )) ||
    false
  );
}

export function justCalledTaskTool(messages: Message[]): boolean {
  const lastAiMessage = messages.findLast((message) => message.type === "ai");
  if (!lastAiMessage) return false;
  const toolMessagesAfterLastAiMessage = messages.slice(
    messages.indexOf(lastAiMessage) + 1,
  );
  const taskToolCallsCompleted = toolMessagesAfterLastAiMessage.some(
    (message) => message.type === "tool" && message.name === "task",
  );
  return (
    (lastAiMessage.tool_calls?.some(
      (call: { name?: string }) => call.name === "task",
    ) &&
      taskToolCallsCompleted) ||
    false
  );
}

export function prepareOptimizerMessage(feedback: string): string {
  return `<feedback>
${feedback}
</feedback>

Use the above feedback to update the config.json file.
`;
}
