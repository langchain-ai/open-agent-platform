import { Message, Part } from "./message"; // Assuming Part is also exported from message.ts or common.ts

export enum TaskState {
  Submitted = "submitted", // Task received by the agent
  Working = "working", // Agent is actively processing the task
  InputRequired = "input-required", // Agent requires further input from the user
  Completed = "completed", // Task finished successfully
  Canceled = "canceled", // Task was canceled by the user or agent
  Failed = "failed", // Task failed due to an error
  Rejected = "rejected", // Task was rejected by the agent (e.g., invalid parameters)
  AuthRequired = "auth-required", // Authentication is required to proceed
  Unknown = "unknown", // Task state is unknown
}

export interface TaskStatus {
  state: TaskState;
  message?: Message; // Optional message associated with the current status (e.g., for input-required)
  timestamp?: string; // ISO 8601 timestamp of when this status was set
  // Potentially other fields like progress percentage, estimated time, etc.
}

export interface Artifact {
  kind: "artifact"; // Identifies this as an Artifact object
  artifactId: string; // Unique identifier for the artifact
  name?: string; // User-friendly name for the artifact
  parts: Part[]; // Content of the artifact
  metadata?: Record<string, any>; // Additional metadata
  // Potentially other fields like creationTimestamp, mimeType (if uniform), etc.
}

export interface Task {
  kind: "task"; // Identifies this as a Task object
  id: string; // Unique identifier for the task
  contextId: string; // ID of the context (conversation) this task belongs to

  status: TaskStatus; // Current status of the task
  history?: Message[]; // History of messages exchanged within this task
  artifacts?: Artifact[]; // Artifacts generated or associated with this task
  metadata?: Record<string, any>; // Additional metadata for the task
  // Potentially other fields: skillId, inputModesUsed, outputModesUsed, etc.
}

// Parameters for task-related RPC calls
export interface TaskGetParams {
  taskId: string;
}

export interface TaskCancelParams {
  taskId: string;
  reason?: string;
}

export interface TaskUpdateParams { // For providing input when state is 'input-required'
  taskId: string;
  message: Message;
  metadata?: Record<string, any>;
}
