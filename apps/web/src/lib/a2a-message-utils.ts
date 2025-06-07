import {
    Task as A2ATask,
    Message as A2AMessage,
    Part as A2APart,
    TextPart as A2ATextPart,
    FilePart as A2AFilePart, // For future use
    DataPart as A2ADataPart, // For future use
} from '@/types/a2a';
import { v4 as uuidv4 } from 'uuid';

// Placeholder - ideally from a shared @/types/chat.ts
export interface ChatMessage {
  id: string;
  role: 'human' | 'ai' | 'system';
  content: string;
  type: 'message' | 'error' | 'tool_call' | 'tool_response' | 'human_feedback';
  timestamp?: string;
  isLoading?: boolean; // Added isLoading as per reconfirmed structure
}

/**
 * Transforms an A2A Task or Message object into an OAP ChatMessage.
 * Extracts textual content from various parts of the A2A response.
 * @param a2aResponse The A2A Task or Message object.
 * @returns A ChatMessage object.
 */
export function transformA2AResponseToChatMessage(a2aResponse: A2ATask | A2AMessage): ChatMessage {
  let responseText = "";
  let partsToProcess: Readonly<A2APart[]> | undefined = undefined;
  let messageTimestamp: string | undefined;

  if (a2aResponse.kind === 'task') {
    if (a2aResponse.status?.timestamp) {
        messageTimestamp = a2aResponse.status.timestamp;
    }
    // Prefer status message parts first
    if (a2aResponse.status?.message?.parts && a2aResponse.status.message.parts.length > 0) {
      partsToProcess = a2aResponse.status.message.parts;
    }
    // Fallback to the first artifact's parts if it seems to contain the primary response
    else if (a2aResponse.artifacts && a2aResponse.artifacts.length > 0 && a2aResponse.artifacts[0].parts) {
      const hasTextInArtifact = a2aResponse.artifacts[0].parts.some(p => p.kind === 'text');
      if (hasTextInArtifact) {
        partsToProcess = a2aResponse.artifacts[0].parts;
      }
    }
  } else if (a2aResponse.kind === 'message') {
    partsToProcess = a2aResponse.parts;
    // A2A Message objects don't have a standard top-level timestamp.
    // We might extract one from metadata if a convention is established, e.g., a2aResponse.metadata?.timestamp
  }

  if (!messageTimestamp) {
    messageTimestamp = new Date().toISOString(); // Default to current time if no specific timestamp found
  }

  if (partsToProcess) {
    const textParts: string[] = [];
    for (const part of partsToProcess) {
      if (part.kind === 'text') {
        textParts.push((part as A2ATextPart).text);
      }
      // TODO: Handle A2AFilePart: e.g., generate a link, an image tag, or a specific UI component.
      // Example: if (part.kind === 'file') { textParts.push(`[File: ${(part as A2AFilePart).file?.fileName || 'unnamed file'}]`); }
      // Consider transforming FilePart into a structured content element if ChatMessage supports it.
      // TODO: Handle A2ADataPart: e.g., render JSON, or use a specific UI component based on data structure or mime-type if provided in part.metadata.
      // Example: if (part.kind === 'data') { textParts.push(`[Data: ${JSON.stringify((part as A2ADataPart).data).substring(0,50)}...]`); }
    }
    responseText = textParts.join("\n");
  }

  if (responseText.trim() === "") {
    const hasNonTextParts = partsToProcess && partsToProcess.some(p => p.kind !== 'text');
    if (hasNonTextParts) {
        responseText = "[ADK agent provided a non-textual response (e.g., file or data). Display for these types is not yet fully implemented.]";
    } else {
        responseText = "[ADK agent provided no textual response or the response was empty.]";
    }
  }

  return {
    id: uuidv4(),
    role: 'ai',
    content: responseText.trim(),
    type: 'message',
    timestamp: messageTimestamp,
    isLoading: false, // A transformed message is considered complete.
    // rawResponse: a2aResponse, // Optional: consider storing for debugging or advanced rendering
  };
}

/**
 * Transforms an error message string into an OAP ChatMessage.
 * @param errorMessage The error message content.
 * @param errorSource Optional string indicating the source or context of the error.
 * @returns A ChatMessage object representing the error.
 */
export function transformErrorToChatMessage(
  errorMessage: string,
  errorSource?: string // Made optional
): ChatMessage {
  const finalErrorSource = errorSource || "System"; // Default error source
  return {
    id: uuidv4(),
    role: 'ai',
    content: `${finalErrorSource} Error: ${errorMessage}`,
    type: 'error',
    timestamp: new Date().toISOString(),
    isLoading: false, // Error messages are also considered complete.
  };
}
