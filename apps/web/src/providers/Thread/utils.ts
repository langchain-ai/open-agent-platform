import { Thread, ThreadState } from "@langchain/langgraph-sdk";
import { IMPROPER_SCHEMA } from "@/constants";
import { HumanInterrupt, ThreadData } from "@/components/agent-inbox/types";

// TODO: Delete this once interrupt issue fixed.
export const tmpCleanInterrupts = (interrupts: Record<string, any[]>) => {
  return Object.fromEntries(
    Object.entries(interrupts).map(([k, v]) => {
      if (Array.isArray(v[0] && v[0]?.[1])) {
        return [k, v?.[0][1]];
      }
      return [k, v];
    }),
  );
};

export function getInterruptFromThread(
  thread: Thread,
): HumanInterrupt[] | undefined {
  try {
    if (thread.interrupts && Object.values(thread.interrupts).length > 0) {
      const result = Object.values(thread.interrupts).flatMap((interrupt) => {
        try {
          // Handle case when interrupt is a direct array with structure as first item
          if (Array.isArray(interrupt) && interrupt.length > 0) {
            // Case 1: Array with nested structure [0][1].value
            if (Array.isArray(interrupt[0])) {
              if (!interrupt[0]?.[1]) {
                return {
                  action_request: { action: IMPROPER_SCHEMA, args: {} },
                  config: {
                    allow_ignore: true,
                    allow_respond: false,
                    allow_edit: false,
                    allow_accept: false,
                  },
                } as HumanInterrupt;
              }
              return interrupt[0][1].value as HumanInterrupt;
            }

            // Case 2: First item has a value property
            if (interrupt[0]?.value !== undefined) {
              const value = interrupt[0].value;

              // Handle case where value is a valid JSON string
              if (
                typeof value === "string" &&
                (value.startsWith("[") || value.startsWith("{"))
              ) {
                try {
                  const parsed = JSON.parse(value);

                  // Parsed is an array of interrupts
                  if (Array.isArray(parsed)) {
                    if (
                      parsed.length > 0 &&
                      parsed[0] &&
                      typeof parsed[0] === "object" &&
                      "action_request" in parsed[0] &&
                      "config" in parsed[0]
                    ) {
                      return parsed as HumanInterrupt[];
                    }
                  }
                  // Parsed is a single interrupt
                  else if (
                    parsed &&
                    typeof parsed === "object" &&
                    "action_request" in parsed &&
                    "config" in parsed
                  ) {
                    return parsed as HumanInterrupt;
                  }
                } catch (_) {
                  // Failed to parse as JSON, continue normal processing
                }
              }

              // Check if value itself is an interrupt object or array
              if (Array.isArray(value)) {
                if (
                  value.length > 0 &&
                  value[0] &&
                  typeof value[0] === "object" &&
                  "action_request" in value[0] &&
                  "config" in value[0]
                ) {
                  return value as HumanInterrupt[];
                }
              } else if (
                value &&
                typeof value === "object" &&
                "action_request" in value &&
                "config" in value
              ) {
                return value as HumanInterrupt;
              }
            }

            // Case 3: First item is directly the interrupt object
            if (
              interrupt[0] &&
              typeof interrupt[0] === "object" &&
              "action_request" in interrupt[0] &&
              "config" in interrupt[0]
            ) {
              return interrupt[0] as HumanInterrupt;
            }

            // Process all items and handle direct interrupt array
            const values = interrupt.flatMap((i) => {
              if (
                i &&
                typeof i === "object" &&
                "action_request" in i &&
                "config" in i
              ) {
                return i as unknown as HumanInterrupt;
              } else if (i?.value) {
                // Check if it's a valid HumanInterrupt structure
                const value = i.value as any;

                if (!value || typeof value !== "object") {
                  return {
                    action_request: { action: IMPROPER_SCHEMA, args: {} },
                    config: {
                      allow_ignore: true,
                      allow_respond: false,
                      allow_edit: false,
                      allow_accept: false,
                    },
                  } as HumanInterrupt;
                }

                // If value is array, check if it contains valid interrupts
                if (Array.isArray(value)) {
                  if (
                    value.length > 0 &&
                    value[0]?.action_request?.action &&
                    value[0]?.config
                  ) {
                    return value as HumanInterrupt[];
                  }
                }

                // Check if value is a direct interrupt object
                if (value?.action_request?.action && value?.config) {
                  return value as HumanInterrupt;
                }

                return {
                  action_request: { action: IMPROPER_SCHEMA, args: {} },
                  config: {
                    allow_ignore: true,
                    allow_respond: false,
                    allow_edit: false,
                    allow_accept: false,
                  },
                } as HumanInterrupt;
              }

              return {
                action_request: { action: IMPROPER_SCHEMA, args: {} },
                config: {
                  allow_ignore: true,
                  allow_respond: false,
                  allow_edit: false,
                  allow_accept: false,
                },
              } as HumanInterrupt;
            });

            return values;
          }

          // Default fallback
          return {
            action_request: { action: IMPROPER_SCHEMA, args: {} },
            config: {
              allow_ignore: true,
              allow_respond: false,
              allow_edit: false,
              allow_accept: false,
            },
          } as HumanInterrupt;
        } catch (_) {
          return {
            action_request: { action: IMPROPER_SCHEMA, args: {} },
            config: {
              allow_ignore: true,
              allow_respond: false,
              allow_edit: false,
              allow_accept: false,
            },
          } as HumanInterrupt;
        }
      });

      return result;
    }
    return undefined;
  } catch (_) {
    return [
      {
        action_request: { action: IMPROPER_SCHEMA, args: {} },
        config: {
          allow_ignore: true,
          allow_respond: false,
          allow_edit: false,
          allow_accept: false,
        },
      },
    ] as HumanInterrupt[];
  }
}

export function processInterruptedThread<
  ThreadValues extends Record<string, any>,
>(thread: Thread<ThreadValues>): ThreadData<ThreadValues> | undefined {
  const interrupts = getInterruptFromThread(thread);
  if (interrupts) {
    // Check if any interrupt has improper_schema action
    const hasInvalidSchema = interrupts.some(
      (interrupt) => interrupt?.action_request?.action === IMPROPER_SCHEMA,
    );

    return {
      thread,
      interrupts,
      status: "interrupted",
      invalidSchema: hasInvalidSchema,
    };
  }
  return undefined;
}

export function processThreadWithoutInterrupts<
  ThreadValues extends Record<string, any>,
>(
  thread: Thread<ThreadValues>,
  state: { thread_state: ThreadState<ThreadValues>; thread_id: string },
): ThreadData<ThreadValues> {
  const lastTask =
    state.thread_state.tasks[state.thread_state.tasks.length - 1];
  const lastInterrupt = lastTask.interrupts[lastTask.interrupts.length - 1];

  if (!lastInterrupt || !("value" in lastInterrupt)) {
    return {
      status: "interrupted",
      thread,
      interrupts: undefined,
    };
  }

  return {
    status: "interrupted",
    thread,
    interrupts: lastInterrupt.value as HumanInterrupt[],
  };
}
