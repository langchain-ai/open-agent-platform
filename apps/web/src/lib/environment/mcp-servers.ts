import { MCPServersConfig } from "@/types/mcp";

/**
 * Get MCP servers configuration from environment variables.
 * Supports both new multi-server format and legacy single-server format.
 *
 * @returns MCPServersConfig object with server configurations
 */
export function getMCPServers(): MCPServersConfig {
  const serversJson = process.env.NEXT_PUBLIC_MCP_SERVERS;

  if (!serversJson) {
    // Backward compatibility: check for single server config
    const singleServerUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
    if (singleServerUrl) {
      return {
        default: {
          type: "http",
          transport: "http",
          url: singleServerUrl,
          authProvider:
            process.env.NEXT_PUBLIC_MCP_AUTH_REQUIRED === "true"
              ? { type: "bearer" }
              : undefined,
        },
      };
    }
    return {};
  }

  try {
    return JSON.parse(serversJson);
  } catch (e) {
    console.error("Failed to parse NEXT_PUBLIC_MCP_SERVERS", e);
    return {};
  }
}
