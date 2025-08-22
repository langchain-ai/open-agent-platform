import { Tool } from "./tool";

// Common fields for all MCP server configurations
export interface MCPServerConfig {
  defaultToolTimeout?: number;
  outputHandling?:
    | "content"
    | "artifact"
    | {
        audio?: "content" | "artifact";
        image?: "content" | "artifact";
        resource?: "content" | "artifact";
        text?: "content" | "artifact";
      };
}

// STDIO transport configuration
export interface MCPServerStdioConfig extends MCPServerConfig {
  type: "stdio";
  transport: "stdio";
  command: string;
  args: string[];
  cwd?: string;
  encoding?: string;
  env?: Record<string, string>;
  restart?: {
    delayMs?: number;
    enabled?: boolean;
    maxAttempts?: number;
  };
  stderr?: "overlapped" | "pipe" | "ignore" | "inherit";
}

// OAuth client provider interface (placeholder for now)
export interface OAuthClientProvider {
  type: "oauth" | "bearer" | "api-key";
  clientId?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  apiKey?: string;
}

// HTTP/SSE transport configuration
export interface MCPServerHTTPConfig extends MCPServerConfig {
  type: "http" | "sse";
  transport: "http" | "sse";
  url: string;
  authProvider?: OAuthClientProvider;
  automaticSSEFallback?: boolean;
  headers?: Record<string, string>;
  reconnect?: {
    delayMs?: number;
    enabled?: boolean;
    maxAttempts?: number;
  };
}

export type MCPServerConfiguration = MCPServerStdioConfig | MCPServerHTTPConfig;

export interface MCPServersConfig {
  [serverName: string]: MCPServerConfiguration;
}

// Update tool type to include server association
export interface ToolWithServer extends Tool {
  serverName: string;
  serverConfig: MCPServerConfiguration;
}
