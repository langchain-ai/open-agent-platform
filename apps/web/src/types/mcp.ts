import { Tool } from "./tool";

// OAuth client provider types
export interface OAuthClientProvider {
  type: "oauth";
  clientId: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
}

// Bearer token provider
export interface BearerTokenProvider {
  type: "bearer";
}

// API key provider
export interface ApiKeyProvider {
  type: "api-key";
  apiKey: string;
}

export type AuthProvider =
  | OAuthClientProvider
  | BearerTokenProvider
  | ApiKeyProvider;

// Output handling configuration
export type OutputHandlingConfig = {
  audio?: "content" | "artifact";
  image?: "content" | "artifact";
  resource?: "content" | "artifact";
  text?: "content" | "artifact";
};

// Common fields for all MCP server configurations
export interface MCPServerConfig {
  defaultToolTimeout?: number;
  outputHandling?: "content" | "artifact" | OutputHandlingConfig;
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

// HTTP/SSE transport configuration
export interface MCPServerHTTPConfig extends MCPServerConfig {
  type: "http" | "sse";
  transport: "http" | "sse";
  url: string;
  authProvider?: AuthProvider;
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

// Server connection state
export interface MCPConnection {
  serverName: string;
  client: any; // Will be Client from @modelcontextprotocol/sdk
  config: MCPServerConfiguration;
}

// Server error state
export interface ServerError {
  serverName: string;
  error: Error;
  retryable: boolean;
  lastAttempt: Date;
}

// Server auth state
export interface ServerAuthState {
  serverName: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}
