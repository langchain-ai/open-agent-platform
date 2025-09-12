import { BaseMessage } from "@langchain/core/messages";
import { Thread, ThreadStatus } from "@langchain/langgraph-sdk";

/**
 * Configuration for a human interrupt, specifying what actions
 * are allowed when handling the interrupt.
 */
export interface HumanInterruptConfig {
  allow_ignore: boolean;
  allow_respond: boolean;
  allow_edit: boolean;
  allow_accept: boolean;
}

/**
 * Action request from the agent to the human.
 * This is part of a HumanInterrupt.
 */
export interface ActionRequest {
  action: string;
  args: Record<string, any>;
}

/**
 * Represents a human interrupt in the agent flow.
 * Similar to the LangGraph Interrupt type but with specific fields
 * for human interaction.
 */
export interface HumanInterrupt {
  action_request: ActionRequest;
  config: HumanInterruptConfig;
  description?: string;
}

/**
 * Human response to an agent interrupt.
 * Can be one of several types: accept, ignore, provide a response, or edit.
 */
export type HumanResponse = {
  type: "accept" | "ignore" | "response" | "edit";
  args: null | string | ActionRequest;
};

/**
 * Extended human response type with additional properties for
 * tracking edit status.
 */
export type HumanResponseWithEdits = HumanResponse &
  (
    | { acceptAllowed?: false; editsMade?: never }
    | { acceptAllowed?: true; editsMade?: boolean }
  );

/**
 * Email data structure used in the thread values.
 */
export type Email = {
  id: string;
  thread_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  page_content: string;
  send_time: string | undefined;
  read?: boolean;
  status?: "in-queue" | "processing" | "hitl" | "done";
};

/**
 * Main thread values type that contains the data
 * passed through the LangGraph workflow.
 */
export interface ThreadValues {
  email: Email;
  messages: BaseMessage[];
  triage: {
    logic: string;
    response: string;
  };
}

/**
 * Extended thread status type that includes our custom statuses.
 * Based on LangGraph ThreadStatus with additions.
 */
export type EnhancedThreadStatus = ThreadStatus | "human_response_needed";

/**
 * Base thread data interface with common properties.
 * This serves as the foundation for all thread data types.
 */
interface BaseThreadData<T extends Record<string, any> = Record<string, any>> {
  thread: Thread<T>;
  invalidSchema?: boolean;
}

/**
 * Thread data for non-interrupted states.
 * Follows the discriminated union pattern where the status
 * field acts as the discriminator.
 */
export interface GenericThreadData<
  T extends Record<string, any> = Record<string, any>,
> extends BaseThreadData<T> {
  status: "idle" | "busy" | "error" | "human_response_needed";
  interrupts?: undefined;
}

/**
 * Thread data for interrupted state.
 * Contains additional fields specific to interruptions.
 */
export interface InterruptedThreadData<
  T extends Record<string, any> = Record<string, any>,
> extends BaseThreadData<T> {
  status: "interrupted";
  interrupts?: HumanInterrupt[];
}

/**
 * Union type for all thread data types.
 * Using discriminated union pattern for better type safety.
 */
export type ThreadData<T extends Record<string, any> = Record<string, any>> =
  | GenericThreadData<T>
  | InterruptedThreadData<T>;

/**
 * Thread status with special "all" option for filtering.
 */
export type ThreadStatusWithAll = EnhancedThreadStatus | "all";

/**
 * Type of submission for human responses.
 */
export type SubmitType = "accept" | "response" | "edit";

/**
 * Configuration for an agent inbox.
 */
export interface AgentInbox {
  /**
   * A unique identifier for the inbox.
   */
  id: string;
  /**
   * The ID of the graph.
   */
  graphId: string;
  /**
   * The ID of the deployment.
   */
  deploymentId: string;
  /**
   * The URL of the deployment. Either a localhost URL, or a deployment URL.
   * @deprecated Use deploymentId instead.
   */
  deploymentUrl?: string;
  /**
   * Optional name for the inbox, used in the UI to label the inbox.
   */
  name?: string;
  /**
   * Whether or not the inbox is selected.
   */
  selected: boolean;
  /**
   * The tenant ID for the deployment (only for deployed graphs).
   */
  tenantId?: string;
  createdAt: string;
}
