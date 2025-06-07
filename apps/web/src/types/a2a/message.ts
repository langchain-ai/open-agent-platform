import { PartBase } from './common';

// Basic Part types
export interface TextPart extends PartBase {
  kind: "text";
  text: string;
}

export interface FilePart extends PartBase {
  kind: "file";
  // Simplified: In reality, this would be more complex, potentially involving URLs or structured file data.
  // For A2A, this often involves a `fileId` that refers to a file uploaded via a separate mechanism
  // or a data URI for inline content.
  file: {
    uri?: string; // e.g., data:image/png;base64,... or a URL to the file
    fileId?: string; // An ID for a pre-uploaded file
    fileName?: string;
    mimeType?: string;
    size?: number;
  };
}

export interface DataPart extends PartBase {
  kind: "data";
  // Arbitrary JSON data, could be structured according to a schema defined by the skill
  data: Record<string, any>;
}

export type Part = TextPart | FilePart | DataPart;

export interface Message {
  kind: "message"; // Identifies this as a Message object
  messageId: string; // Unique identifier for the message
  role: "user" | "agent" | "system"; // Role of the sender
  parts: Part[]; // Array of message parts

  taskId?: string; // Optional: ID of the task this message relates to
  contextId?: string; // Optional: ID of the context (conversation) this message belongs to
  metadata?: Record<string, any>; // Optional: Additional metadata
  extensions?: string[]; // Optional: List of extensions used by this message
}

export interface MessageSendConfiguration {
  acceptedOutputModes?: string[]; // e.g., ["text/plain", "application/json"]
  historyLength?: number; // Number of previous messages to consider
  pushNotificationConfig?: any; // Configuration for push notifications (agent-specific)
  blocking?: boolean; // If true, client waits for task completion (or first agent message if streaming)
  // Other potential fields: locale, timezone, customConfig, etc.
}

export interface MessageSendParams {
  message: Message;
  configuration?: MessageSendConfiguration;
  metadata?: Record<string, any>; // Metadata for the send operation itself
}
