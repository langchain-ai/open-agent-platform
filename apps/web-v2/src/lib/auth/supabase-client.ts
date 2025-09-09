import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Get a Supabase client instance (creates a singleton)
 *
 * @returns A Supabase client instance
 */
export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  // Use the browser client when in browser environment
  if (typeof window !== "undefined") {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          return document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")?.[1];
        },
        set(name, value, options) {
          document.cookie = `${name}=${value}; path=${options?.path ?? "/"}; max-age=${options?.maxAge ?? 31536000}`;
        },
        remove(name, options) {
          document.cookie = `${name}=; path=${options?.path ?? "/"}; max-age=0`;
        },
      },
    });
  } else {
    // For server-side, use the regular client
    // The middleware will use createServerClient separately
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseInstance;
}
