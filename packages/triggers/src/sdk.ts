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
  /**
   * The name of the trigger to display in the UI.
   */
  displayName: string;
  /**
   * A description of the trigger to display in the UI.
   */
  description?: string;
  /**
   * A unique ID to identify the trigger by
   */
  id: string;
  /**
   * HTTP method & path for the webhook
   */
  method: "POST" | "GET";
  /**
   * The path to register the trigger at
   */
  path: string;
  /**
   * The handler function for the trigger
   */
  handler: (
    payload: z.infer<P>,
    ctx: TriggerContext,
  ) => Promise<TriggerHandlerResult>;
  /**
   * The payload schema for the trigger
   */
  payload?: P;
  /**
   * Optional signature verification, throws on failure
   */
  verify?: (ctx: TriggerContext) => Promise<void> | void;
};

export function createTrigger<P extends z.ZodTypeAny>(
  args: CreateTriggerArgs<P>,
): TriggerDefinition<z.infer<P>> {
  return {
    displayName: args.displayName,
    description: args.description,
    id: args.id,
    method: args.method,
    path: args.path,
    payloadSchema: args.payload,
    verify: args.verify,
    handler: args.handler,
  };
}

// -- Config loader ------------------------------------------------------------

export type TriggerConfigEntry = {
  /**
   * Dynamic import returning a module exporting default TriggerDefinition
   */
  module: () => Promise<{ default: TriggerDefinition<any> }>;
  /**
   * The path to register the trigger at
   */
  path: string;
};

export type TriggerConfig = {
  /**
   * Base path to mount triggers under
   * @default "/triggers"
   */
  basePath?: string;
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
      path: entry.path,
    });
  }
  return defs;
}

/**
 * Lists the paths that triggers will be mounted at based on the configuration.
 * This is useful for introspection without loading the actual trigger modules.
 */
export function listTriggerPaths(cfg: TriggerConfig): string[] {
  const basePath = cfg.basePath ?? "/triggers";
  const paths: string[] = [];

  for (const entry of cfg.entries) {
    paths.push(nodePath.join(basePath, entry.path));
  }

  return paths;
}

// -- Hono route mounting ---------------------------------------------------

export type MountOptions = {
  /**
   * Base path to mount triggers under
   * @default "/triggers"
   */
  basePath?: string;
  logger?: Logger;
  env?: Record<string, string | undefined>;
  dedupe?: TriggerContext["dedupe"];
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
    const path = nodePath.join(basePath, def.path);
    const method = (def.method ?? "POST").toLowerCase() as "post" | "get";

    log.info?.(
      `[triggers] Mounting ${def.path} -> ${method.toUpperCase()} ${path}`,
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
        const response = await def.handler(payload, ctx);

        // 4) HTTP response back to provider
        if (response.headers) {
          Object.entries(response.headers).forEach(([key, value]) => {
            c.header(key, String(value));
          });
        }
        return c.json(
          response.body ?? { ok: true },
          (response.status as any) ?? 200,
        );
      } catch (err: any) {
        log.error?.(`[triggers] ${def.path} error:`, err?.stack ?? err);
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
