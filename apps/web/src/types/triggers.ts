export interface Trigger {
  /**
   * The provider ID of the trigger
   */
  providerId: string;
  /**
   * A unique UUID v4 to identify the trigger by
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
}
