export interface Trigger {
  /**
   * A unique identifier for the trigger (e.g., "gmail-email-received")
   */
  id: string;
  /**
   * The name of the trigger
   */
  displayName: string;
  /**
   * An optional description of the trigger
   */
  description?: string;
  /**
   * The URL path to call when registering the trigger
   */
  path: string;
  /**
   * The method to use when registering the trigger
   */
  method: "POST" | "GET";
  /**
   * A JSON schema for the payload of the trigger registration
   */
  payloadSchema: Record<string, any> | null;
  /**
   * The output schema defining fields this trigger provides
   */
  outputSchema?: Record<string, { type: string; description: string }>;
}
