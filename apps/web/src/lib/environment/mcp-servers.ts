import { MCPServersConfig, MCPServerHTTPConfig } from "@/types/mcp";

/**
 * Parse and return MCP servers configuration from environment variables.
 * Supports both new multi-server format (NEXT_PUBLIC_MCP_SERVERS) and
 * legacy single-server format (NEXT_PUBLIC_BASE_API_URL) for backward compatibility.
 */
export function getMCPServers(): MCPServersConfig {
  // First, check for new multi-server configuration
  const serversJson = process.env.NEXT_PUBLIC_MCP_SERVERS;
  
  if (serversJson) {
    try {
      const servers = JSON.parse(serversJson);
      
      // Validate that it's an object
      if (typeof servers !== 'object' || servers === null || Array.isArray(servers)) {
        console.error("NEXT_PUBLIC_MCP_SERVERS must be a JSON object");
        return {};
      }
      
      return servers as MCPServersConfig;
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_MCP_SERVERS:", e);
      return {};
    }
  }
  
  // Backward compatibility: check for legacy single server configuration
  const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
  
  if (baseApiUrl) {
    console.warn(
      "Using deprecated NEXT_PUBLIC_BASE_API_URL. " +
      "Please migrate to NEXT_PUBLIC_MCP_SERVERS for multi-server support."
    );
    
    try {
      // Parse the URL to ensure it's valid
      new URL(baseApiUrl);
      
      // Check if authentication is required (from legacy env var if it exists)
      const authRequired = process.env.NEXT_PUBLIC_MCP_AUTH_REQUIRED === "true";
      
      // Create a default server configuration
      const defaultServer: MCPServerHTTPConfig = {
        type: "http",
        transport: "http",
        url: baseApiUrl,
        // Only add authProvider if authentication is required
        ...(authRequired && {
          authProvider: {
            type: "bearer"
          }
        })
      };
      
      return {
        default: defaultServer
      };
    } catch (e) {
      console.error("Invalid NEXT_PUBLIC_BASE_API_URL:", e);
      return {};
    }
  }
  
  // No configuration found
  return {};
}

/**
 * Get a specific MCP server configuration by name
 */
export function getMCPServer(serverName: string): MCPServerHTTPConfig | undefined {
  const servers = getMCPServers();
  const server = servers[serverName];
  
  if (!server) {
    return undefined;
  }
  
  // Only return HTTP/SSE servers (STDIO not supported in browser)
  if (server.type === "http" || server.type === "sse") {
    return server as MCPServerHTTPConfig;
  }
  
  console.warn(`Server ${serverName} uses STDIO transport which is not supported in browser environment`);
  return undefined;
}

/**
 * Check if any MCP servers are configured
 */
export function hasMCPServers(): boolean {
  const servers = getMCPServers();
  return Object.keys(servers).length > 0;
}

/**
 * Get list of configured server names
 */
export function getMCPServerNames(): string[] {
  const servers = getMCPServers();
  return Object.keys(servers);
}

/**
 * Validate MCP servers configuration
 */
export function validateMCPServers(servers: MCPServersConfig): string[] {
  const errors: string[] = [];
  
  for (const [serverName, config] of Object.entries(servers)) {
    if (config.type === "stdio") {
      if (!config.command) {
        errors.push(`Server ${serverName}: STDIO transport requires 'command' field`);
      }
      if (!Array.isArray(config.args)) {
        errors.push(`Server ${serverName}: STDIO transport requires 'args' to be an array`);
      }
    } else if (config.type === "http" || config.type === "sse") {
      if (!config.url) {
        errors.push(`Server ${serverName}: HTTP/SSE transport requires 'url' field`);
      } else {
        try {
          new URL(config.url);
        } catch (_e) {
          errors.push(`Server ${serverName}: Invalid URL '${config.url}'`);
        }
      }
      
      // Validate auth provider if present
      if (config.authProvider) {
        if (config.authProvider.type === "oauth" && !config.authProvider.clientId) {
          errors.push(`Server ${serverName}: OAuth auth provider requires 'clientId'`);
        }
        if (config.authProvider.type === "api-key" && !config.authProvider.apiKey) {
          errors.push(`Server ${serverName}: API key auth provider requires 'apiKey'`);
        }
      }
    } else {
      errors.push(`Server ${serverName}: Invalid transport type '${config.type}'`);
    }
  }
  
  return errors;
}


