import { z } from 'zod';

// Based on A2A Specification v1.0 (or latest understanding)

export interface AgentServiceEndpoint {
  name: "message" | "task" | "capabilities" | string;
  url: string;
  // Potentially other details like transport
}
export const AgentServiceEndpointSchema = z.object({
  name: z.union([z.literal("message"), z.literal("task"), z.literal("capabilities"), z.string()]),
  url: z.string().url(),
  // metadata: z.record(z.any()).optional(), // Example if needed
});


export interface AgentSkill {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
  metadata?: Record<string, any>;
}
export const AgentSkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  inputModes: z.array(z.string()).optional(),
  outputModes: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});


export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
  extensions?: any[]; // extensions can be complex, using z.array(z.any()) for now
}
export const AgentCapabilitiesSchema = z.object({
  streaming: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  stateTransitionHistory: z.boolean().optional(),
  extensions: z.array(z.any()).optional(),
});

// Simplified placeholder for SecurityScheme due to its complexity and variability
export interface SecurityScheme {
  type: "http" | "apiKey" | "oauth2" | string;
  description?: string;
  scheme?: "bearer" | string; // For "http"
  name?: string; // For "apiKey"
  in?: "header" | "query" | "cookie"; // For "apiKey"
  flows?: any; // For "oauth2"
}
export const SecuritySchemeSchema = z.object({
  type: z.string().min(1),
  description: z.string().optional(),
  scheme: z.string().optional(), // For "http"
  name: z.string().optional(), // For "apiKey"
  in: z.enum(["header", "query", "cookie"]).optional(), // For "apiKey"
  flows: z.any().optional(), // For "oauth2"
}).catchall(z.any()); // Allow other fields


// Assuming a simple structure for AgentProvider for now
export interface AgentProvider {
    name: string;
    url?: string;
}
export const AgentProviderSchema = z.object({
    name: z.string().min(1),
    url: z.string().url().optional(),
});


export interface AgentCard {
  kind: "agent-card";
  name: string;
  description?: string;
  url: string; // Primary A2A JSON-RPC service endpoint
  iconUrl?: string;
  provider?: AgentProvider;
  version: string;
  documentationUrl?: string;
  capabilities: AgentCapabilities;
  securitySchemes?: Record<string, SecurityScheme>;
  security?: Array<Record<string, string[]>>; // Array of security requirements objects
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: AgentSkill[];
  supportsAuthenticatedExtendedCard?: boolean;
  serviceEndpoints?: AgentServiceEndpoint[];
  metadata?: Record<string, any>;
}
export const AgentCardSchema = z.object({
  kind: z.literal("agent-card"),
  name: z.string().min(1, "Agent name is required"),
  description: z.string().optional(),
  url: z.string().url("Primary A2A service URL must be a valid URL"),
  iconUrl: z.string().url().optional(),
  provider: AgentProviderSchema.optional(),
  version: z.string().min(1, "Agent version is required"),
  documentationUrl: z.string().url().optional(),
  capabilities: AgentCapabilitiesSchema, // Required
  securitySchemes: z.record(SecuritySchemeSchema).optional(),
  security: z.array(z.record(z.array(z.string()))).optional(),
  defaultInputModes: z.array(z.string()), // Required, can be empty array
  defaultOutputModes: z.array(z.string()), // Required, can be empty array
  skills: z.array(AgentSkillSchema), // Required, can be empty array
  supportsAuthenticatedExtendedCard: z.boolean().optional(),
  serviceEndpoints: z.array(AgentServiceEndpointSchema).optional(),
  metadata: z.record(z.any()).optional(),
});
