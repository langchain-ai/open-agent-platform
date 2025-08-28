import type { z } from "zod";
import type { Context } from "hono";

export interface TriggerHandlerResult {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export type Logger = Pick<Console, "info" | "warn" | "error" | "debug">;

export interface DedupeStore {
  /** returns true if the key has been seen recently */
  has(key: string): Promise<boolean>;
  /** remember a key for ttlSeconds */
  set(key: string, ttlSeconds: number): Promise<void>;
}

export interface TriggerContext {
  c: Context; // Hono context containing req, res, and other utilities
  rawBody: Buffer; // needed for HMAC verification
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  query: Record<string, unknown>;
  env: Record<string, string | undefined>;
  log: Logger;
  dedupe?: DedupeStore; // optional, for idempotency
}

export type VerifyFn = (ctx: TriggerContext) => Promise<void> | void;

export interface TriggerDefinition<P> {
  /**
   * The method the trigger handler endpoint accepts.
   */
  method: "POST" | "GET";
  /**
   * The path to register the trigger at
   */
  path: string;
  /**
   * zod schema for payload validation. If omitted, raw JSON body is used.
   * IMPORTANT: we parse AFTER verify() to ensure rawBody is untouched for signatures.
   */
  payloadSchema?: z.ZodType<P>;

  /** Optional signature verification, throws on failure */
  verify?: VerifyFn;

  /** Your business logic: turns a payload into HumanMessage[] (and optionally an HTTP response) */
  handler: (payload: P, ctx: TriggerContext) => Promise<TriggerHandlerResult>;
  /**
   * The type of trigger endpoint.
   */
  type: "trigger_handler" | "trigger_register";
}

export interface TriggerConfigEntry {
  /**
   * A unique ID to identify the trigger by
   */
  id: string;
  /**
   * The name of the trigger to display in the UI.
   */
  displayName: string;
  /**
   * A description of the trigger to display in the UI.
   */
  description?: string;
  /**
   * The endpoint and method for the trigger handler.
   */
  triggerHandler: () => Promise<{ default: TriggerDefinition<any> }>;
  /**
   * The endpoint and method for the trigger register handler.
   */
  registerHandler: () => Promise<{ default: TriggerDefinition<any> }>;
}
