import type { z } from "zod";
import {
  TriggerDefinition,
  TriggerContext,
  TriggerHandlerResult,
  Logger,
} from "./types.js";
import { Hono } from "hono";
import { BlankEnv, BlankSchema } from "hono/types";
import nodePath from "path";

type CreateTriggerArgs<P extends z.ZodTypeAny> = {
  id: string;
  displayName?: string;
  description?: string;
  method?: "POST" | "GET";
  path?: string;
  payload: P;
  verify?: (ctx: TriggerContext) => Promise<void> | void;
  handler: (
    payload: z.infer<P>,
    ctx: TriggerContext,
  ) => Promise<TriggerHandlerResult>;
};

export function createTrigger<P extends z.ZodTypeAny>(
  args: CreateTriggerArgs<P>,
): TriggerDefinition<z.infer<P>> {
  return {
    id: args.id,
    displayName: args.displayName,
    description: args.description,
    method: args.method ?? "POST",
    path: args.path,
    payloadSchema: args.payload,
    verify: args.verify,
    handler: args.handler,
  };
}

// -- Config loader ------------------------------------------------------------

export type TriggerConfigEntry = {
  /** stable id, used in URLs unless path is provided */
  id?: string;
  /** optional URL path override, e.g., "/github" */
  path?: string;
  /** dynamic import returning a module exporting default TriggerDefinition */
  module: () => Promise<{ default: TriggerDefinition<any> }>;
};

export type TriggerConfig = {
  basePath?: string; // defaults to "/triggers"
  entries: TriggerConfigEntry[];
};

export function defineTriggers(cfg: TriggerConfig) {
  return cfg;
}

export async function loadTriggers(
  cfg: TriggerConfig,
): Promise<TriggerDefinition<any>[]> {
  const defs: TriggerDefinition<any>[] = [];
  for (const entry of cfg.entries) {
    const mod = await entry.module();
    const def = mod.default;
    defs.push({
      ...def,
      id: entry.id ?? def.id,
      path: entry.path ?? def.path,
    });
  }
  return defs;
}

// -- Hono route mounting ---------------------------------------------------

export type MountOptions = {
  basePath?: string; // default "/triggers"
  logger?: Logger;
  env?: Record<string, string | undefined>;
  dedupe?: TriggerContext["dedupe"]; // optional, for idempotency support
};

/**
 * Mounts all triggers under /basePath.
 * We attach rawBody for signature checks and still give handlers parsed JSON.
 */
export function mountTriggers(
  app: Hono<BlankEnv, BlankSchema, "/">,
  triggers: TriggerDefinition<any>[],
  opts: MountOptions = {},
) {
  const basePath = opts.basePath ?? "/triggers";
  const log = opts.logger ?? console;

  for (const def of triggers) {
    const path = def.path
      ? nodePath.join(basePath, def.path)
      : nodePath.join(basePath, def.id);
    const method = (def.method ?? "POST").toLowerCase() as "post" | "get";

    log.info?.(
      `[triggers] Mounting ${def.id} -> ${method.toUpperCase()} ${path}`,
    );

    app[method](path, async (c) => {
      // Get raw body for signature verification
      const rawBodyText = await c.req.text();
      const rawBody = Buffer.from(rawBodyText, "utf8");

      // Parse headers into the expected format
      const headers: Record<string, string | string[] | undefined> = {};
      c.req.raw.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const ctx: TriggerContext = {
        c,
        rawBody,
        headers,
        params: c.req.param(),
        query: Object.fromEntries(new URL(c.req.url).searchParams.entries()),
        env: opts.env ?? process.env,
        log,
        dedupe: opts.dedupe,
      };

      try {
        // 1) optional signature verification (uses rawBody)
        if (def.verify) await def.verify(ctx);

        // 2) payload validation/parse
        let incoming: any = {};
        try {
          if (rawBodyText) {
            incoming = JSON.parse(rawBodyText);
          }
        } catch {
          // If JSON parsing fails, use empty object
        }
        const payload = def.payloadSchema
          ? def.payloadSchema.parse(incoming)
          : incoming;

        // 3) handler
        const result = await def.handler(payload, ctx);
        const { messages, response } = Array.isArray(result)
          ? { messages: result, response: undefined }
          : result;

        // 4) HTTP response back to provider (some services need a specific body)
        if (response) {
          if (response.headers) {
            Object.entries(response.headers).forEach(([key, value]) => {
              c.header(key, value);
            });
          }
          return c.json(
            response.body ?? { ok: true },
            (response.status as any) ?? 200,
          );
        } else {
          // Default: return the messages; your outer app can dispatch them to the agent
          return c.json({ messages });
        }
      } catch (err: any) {
        log.error?.(`[triggers] ${def.id} error:`, err?.stack ?? err);
        const status = err?.statusCode ?? 400;
        return c.json(
          {
            error: {
              message: err?.message ?? "Trigger handler error",
              code: err?.code,
            },
          },
          status,
        );
      }
    });
  }
}
