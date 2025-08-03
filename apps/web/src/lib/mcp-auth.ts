import { MCPServerHTTPConfig } from "@/types/mcp";
import { NextRequest } from "next/server";

interface ServerAuthState {
  serverName: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Handle authentication for a specific MCP server based on its configuration.
 * Supports bearer tokens, API keys, and OAuth flows.
 */
export async function handleServerAuth(
  serverConfig: MCPServerHTTPConfig,
  req: NextRequest
): Promise<string | null> {
  if (!serverConfig.authProvider) {
    return null;
  }

  const { authProvider } = serverConfig;

  switch (authProvider.type) {
    case "oauth":
      return handleOAuthFlow(serverConfig, authProvider, req);
    case "bearer":
      return handleBearerToken(serverConfig, req);
    case "api-key":
      return authProvider.apiKey || null;
    default:
      console.warn(
        `Unknown auth provider type: ${(authProvider as any).type}`
      );
      return null;
  }
}

/**
 * Handle OAuth 2.0 authentication flow.
 * This is a stub implementation that should be expanded based on specific OAuth requirements.
 */
async function handleOAuthFlow(
  serverConfig: MCPServerHTTPConfig,
  authProvider: any,
  req: NextRequest
): Promise<string | null> {
  // Check for existing valid token
  const existingToken = await getStoredToken(serverConfig.url);
  if (existingToken && !isTokenExpired(existingToken)) {
    return existingToken.accessToken || null;
  }

  // TODO: Implement OAuth 2.0 flow as per MCP spec
  // This would involve:
  // 1. Discovery of authorization server
  // 2. Dynamic client registration if needed
  // 3. Authorization code flow with PKCE
  // 4. Token exchange
  // 5. Token storage

  // For now, return null as placeholder
  console.warn(
    "OAuth flow not fully implemented. Returning null for OAuth authentication."
  );
  return null;
}

/**
 * Handle bearer token authentication.
 * Checks multiple sources for bearer tokens in order of precedence.
 */
async function handleBearerToken(
  serverConfig: MCPServerHTTPConfig,
  req: NextRequest
): Promise<string | null> {
  // Check for bearer token in various sources
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check cookies
  const tokenCookie = req.cookies.get("X-MCP-Access-Token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  // Check environment variables
  const envTokens = process.env.MCP_TOKENS;
  if (envTokens) {
    try {
      const tokens = JSON.parse(envTokens);
      return tokens[serverConfig.url] || null;
    } catch (e) {
      console.error("Failed to parse MCP_TOKENS", e);
    }
  }

  return null;
}

/**
 * Get stored token for a server URL.
 * This is a placeholder implementation that should be replaced with actual token storage.
 */
async function getStoredToken(
  serverUrl: string
): Promise<ServerAuthState | null> {
  // TODO: Implement actual token storage retrieval
  // This could use cookies, local storage, or a server-side session store
  return null;
}

/**
 * Check if a token has expired.
 */
function isTokenExpired(authState: ServerAuthState): boolean {
  if (!authState.expiresAt) {
    return false;
  }
  return Date.now() > authState.expiresAt;
}
