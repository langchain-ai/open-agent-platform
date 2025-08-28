export interface Trigger {
  /**
   * A unique UUID v4 to identify the trigger by
   */
  id: string;
  /**
   * The name of the trigger
   */
  name: string;
  /**
   * An optional description of the trigger
   */
  description?: string;
  /**
   * The URL to call when registering the trigger
   */
  registerUrl: string;
  /**
   * The method to use when registering the trigger
   */
  registerMethod?: "POST" | "GET";
  /**
   * Query parameters for the trigger registration.
   * For params which should be set by the user, leave the value empty.
   */
  queryParams?: Record<string, string>;
  /**
   * A JSON schema for the payload of the trigger registration
   */
  payloadSchema?: Record<string, any>;
}
