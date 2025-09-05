import { createServerClient } from "@supabase/ssr";
import { McpServerConfig } from "@/types/mcp-server";

/**
 * Check if MCP server is available either via environment variable or user configuration
 * @param userId - Optional user ID to check user-specific configuration
 * @returns boolean indicating if MCP server is available
 */
export async function isMcpServerAvailable(userId?: string): Promise<boolean> {
  // First check if environment variable is set
  if (process.env.NEXT_PUBLIC_MCP_SERVER_URL) {
    return true;
  }

  // If no user ID provided, can't check user config
  if (!userId) {
    return false;
  }

  // Check user's custom MCP server configuration
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return false;
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    });

    const { data, error } = await supabase
      .from("users_config")
      .select("mcp_servers")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
      console.error("Error checking user MCP server config:", error);
      return false;
    }

    const mcpConfig: McpServerConfig | null = data?.mcp_servers || null;
    return !!(mcpConfig?.url);
  } catch (error) {
    console.error("Error in isMcpServerAvailable:", error);
    return false;
  }
}

/**
 * Client-side version that only checks environment variable
 * For use in client components where we can't access user config directly
 */
export function isMcpServerAvailableClient(): boolean {
  return !!process.env.NEXT_PUBLIC_MCP_SERVER_URL;
}