import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getMCPServerConfigs,
  isMCPServerConfig,
} from "@/lib/environment/mcp-servers";
import { validate } from "uuid";
import { MCPServerConfig } from "@/types/mcp";

// This will contain the object which contains the access token
const mcpServers = getMCPServerConfigs();

const isAuthRequired = (server: MCPServerConfig): boolean => !!server.authUrl;

async function getSupabaseToken(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    // Create a Supabase client using the server client with cookies from the request
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {}, // Not needed for token retrieval
        remove() {}, // Not needed for token retrieval
      },
    });

    // Get the session which contains the access token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return null;
    }

    return session.access_token;
  } catch (error) {
    console.error("Error getting Supabase token:", error);
    return null;
  }
}

async function getMcpAccessToken(supabaseToken: string, mcpServerUrl: URL) {
  const mcpUrl = `${mcpServerUrl.href}/mcp`;
  const mcpOauthUrl = `${mcpServerUrl.href}/oauth/token`;

  try {
    // Exchange Supabase token for MCP access token
    const formData = new URLSearchParams();
    formData.append("client_id", "mcp_default");
    formData.append("subject_token", supabaseToken);
    formData.append(
      "grant_type",
      "urn:ietf:params:oauth:grant-type:token-exchange",
    );
    formData.append("resource", mcpUrl);
    formData.append(
      "subject_token_type",
      "urn:ietf:params:oauth:token-type:access_token",
    );

    const tokenResponse = await fetch(mcpOauthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      return tokenData.access_token;
    } else {
      console.error("Token exchange failed:", await tokenResponse.text());
    }
  } catch (e) {
    console.error("Error during token exchange:", e);
  }
}

function getIdAndPath(url: URL): {
  id: string | null;
  pathRest: string;
} {
  // Extract the path and ID from the new format
  // Example: /api/oap_mcp/proxy/[id] -> extract [id] and use it for the path
  const pathMatch = url.pathname.match(
    /^\/api\/oap_mcp\/proxy\/([^/]+)(?:\/(.*))?$/,
  );

  let id: string | null = null;
  let pathRest = "";

  if (pathMatch) {
    // New path format: /api/oap_mcp/proxy/[id]
    id = pathMatch[1];
    pathRest = pathMatch[2] ? `/${pathMatch[2]}` : "";
  }
  return { id, pathRest };
}

function findServerOrThrow(url: URL): MCPServerConfig | Response {
  if (!mcpServers?.length) {
    return new Response(
      JSON.stringify({
        message:
          "No MCP servers found. Please set NEXT_PUBLIC_MCP_SERVERS environment variable.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const { id } = getIdAndPath(url);
  if (!id || !validate(id)) {
    return new Response(
      JSON.stringify({
        message: "Invalid MCP server ID.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const selectedServer = mcpServers.find((mcpServer) => mcpServer.id === id);
  if (!selectedServer) {
    return new Response(
      JSON.stringify({
        message: "MCP server not found.",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  return selectedServer;
}

/**
 * Proxies requests from the client to the MCP server.
 * Extracts the path after '/api/oap_mcp', constructs the target URL,
 * forwards the request with necessary headers and body, and injects
 * the MCP authorization token.
 *
 * @param req The incoming NextRequest.
 * @returns The response from the MCP server.
 */
export async function proxyRequest(req: NextRequest): Promise<Response> {
  const reqUrl = new URL(req.url);
  const selectedServer = findServerOrThrow(reqUrl);
  if (!isMCPServerConfig(selectedServer)) {
    return selectedServer;
  }

  const { pathRest } = getIdAndPath(reqUrl);

  // Construct the target URL
  const targetUrlObj = new URL(selectedServer.url);
  targetUrlObj.pathname = `${targetUrlObj.pathname}${targetUrlObj.pathname.endsWith("/") ? "" : "/"}${pathRest}${reqUrl.search}`;
  const targetUrl = targetUrlObj.toString();

  // Prepare headers, forwarding original headers except Host
  // and adding Authorization
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Some headers like 'host' should not be forwarded
    if (key.toLowerCase() !== "host") {
      headers.append(key, value);
    }
  });

  const mcpAccessTokenCookieName = `X-MCP-Access-Token-${selectedServer.id}`;
  const mcpAccessTokenCookie = req.cookies.get(mcpAccessTokenCookieName)?.value;
  let accessToken: string | null = null;

  if (isAuthRequired(selectedServer)) {
    const supabaseToken = await getSupabaseToken(req);

    if (mcpAccessTokenCookie) {
      accessToken = mcpAccessTokenCookie;
    }

    // If no token yet, try Supabase-JWT token exchange
    if (!accessToken && supabaseToken) {
      accessToken = await getMcpAccessToken(
        supabaseToken,
        new URL(selectedServer.url),
      );
    }

    // If we still don't have a token, return an error
    if (!accessToken) {
      return new Response(
        JSON.stringify({
          message: "Failed to obtain access token from any source.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Set the Authorization header with the token
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  headers.set("Accept", "application/json, text/event-stream");

  // Determine body based on method
  let body: BodyInit | null | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    // For POST, PUT, PATCH, DELETE etc., forward the body
    body = req.body;
  }

  try {
    // Make the proxied request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });
    // Clone the response to create a new one we can modify
    const responseClone = response.clone();

    // Create a new response with the same status, headers, and body
    let newResponse: NextResponse;

    try {
      // Try to parse as JSON first
      const responseData = await responseClone.json();
      newResponse = NextResponse.json(responseData, {
        status: response.status,
        statusText: response.statusText,
      });
    } catch (_) {
      // If not JSON, use the raw response body
      const responseBody = await response.text();
      newResponse = new NextResponse(responseBody, {
        status: response.status,
        statusText: response.statusText,
      });
    }

    // Copy all headers from the original response
    response.headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });

    if (isAuthRequired(selectedServer)) {
      // If we used the Supabase token exchange, add the access token to the response
      // so it can be used in future requests
      if (!mcpAccessTokenCookie && accessToken) {
        // Set a cookie with the access token that will be included in future requests
        newResponse.cookies.set({
          name: mcpAccessTokenCookieName,
          value: accessToken,
          httpOnly: false, // Allow JavaScript access so it can be read for headers
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 3600, // 1 hour expiration
        });
      }
    }

    return newResponse;
  } catch (error) {
    console.error("MCP Proxy Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ message: "Proxy request failed", error: errorMessage }),
      {
        status: 502, // Bad Gateway
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
