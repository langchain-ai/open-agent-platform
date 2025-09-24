export interface Trigger {
  /**
   * A unique identifier for the trigger (e.g., "gmail-email-received")
   */
  id: string;
  /**
   * The provider of the trigger (e.g., "google")
   */
  provider: string;
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
   * Whether this trigger requires a display name to be provided
   */
  requireDisplayName?: boolean;
}

export interface ListTriggerRegistrationsData {
  id: string;
  user_id: string;
  template_id: string;
  resource: unknown;
  linked_agent_ids: string[];
  created_at: string;
}

export interface GroupedTriggerRegistrationsByProvider {
  [provider: string]: {
    registrations: {
      [templateId: string]: ListTriggerRegistrationsData[];
    };
    triggers: Trigger[];
  };
}
