import { NextRequest } from "next/server";

const MCP_SERVER_URL = process.env.MCP_SERVER_URL;

/**
 * Proxies requests from the client to the MCP server.
 * Extracts the path after '/api/oap_mcp', constructs the target URL,
 * forwards the request with necessary headers and body, and injects
 * the MCP authorization token if available.
 *
 * @param req The incoming NextRequest.
 * @returns The response from the MCP server.
 */
export async function proxyRequest(req: NextRequest): Promise<Response> {
  if (!MCP_SERVER_URL) {
    return new Response(
      JSON.stringify({
        message: "MCP_SERVER_URL environment variable is not set.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Extract the path after '/api/oap_mcp/'
  // Example: /api/oap_mcp/foo/bar -> /foo/bar
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/oap_mcp/, "");

  // Construct the target URL
  const targetUrl = `${MCP_SERVER_URL}${path}${url.search}`;

  // Prepare headers, forwarding original headers except Host
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Some headers like 'host' should not be forwarded
    if (key.toLowerCase() !== "host") {
      headers.append(key, value);
    }
  });

  // Try to get the access token from cookies
  const accessToken = req.cookies.get("mcp_access_token")?.value;
  
  // Or from the static environment variable for backward compatibility
  const staticToken = process.env.MCP_SERVER_ACCESS_TOKEN;
  
  // If we have an access token, add it to the headers
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else if (staticToken) {
    headers.set("Authorization", `Bearer ${staticToken}`);
  } else {
    // If no token available, check if this is an endpoint that requires authentication
    if (!path.startsWith("/oauth") && !path.includes("/auth/")) {
      return new Response(
        JSON.stringify({
          message: "Authentication required. Please authenticate with the MCP server.",
          error: "unauthorized",
          auth_url: "/api/oap_mcp/auth",
        }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        },
      );
    }
  }

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
      headers: headers,
      body: body,
      // Important for streaming bodies
      // @ts-expect-error - duplex is required for streaming
      duplex: "half",
    });

    // If we get an unauthorized response, we need to redirect to the auth flow
    if (response.status === 401 && !path.startsWith("/oauth") && !path.includes("/auth/")) {
      return new Response(
        JSON.stringify({
          message: "Authentication required. Please authenticate with the MCP server.",
          error: "unauthorized",
          auth_url: "/api/oap_mcp/auth",
        }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        },
      );
    }

    // Return the response from the MCP server directly
    return response;
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
