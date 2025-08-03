import { NextRequest, NextResponse } from "next/server";
import { getMCPServers } from "@/lib/environment/mcp-servers";
import { handleServerAuth } from "@/lib/mcp-auth";

export const runtime = "edge";

export async function proxyRequest(
  req: NextRequest,
  { params }: { params: { server: string; path: string[] } }
): Promise<Response> {
  const servers = getMCPServers();
  const serverConfig = servers[params.server];

  if (!serverConfig) {
    return NextResponse.json(
      { message: `Server ${params.server} not found` },
      { status: 404 }
    );
  }

  if (serverConfig.type === "stdio") {
    return NextResponse.json(
      { message: "STDIO transport not supported via proxy" },
      { status: 400 }
    );
  }

  // Construct target URL
  const path = params.path.join("/");
  const targetUrl = new URL(serverConfig.url);
  targetUrl.pathname = `${targetUrl.pathname}/mcp/${path}`;

  // Handle authentication based on server config
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.append(key, value);
    }
  });

  // Apply server-specific auth
  if (serverConfig.authProvider) {
    const accessToken = await handleServerAuth(serverConfig, req);
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  // Apply custom headers
  if (serverConfig.headers) {
    Object.entries(serverConfig.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  // Make the proxied request
  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body: req.body,
  });

  // Return the response
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// Export handlers for all HTTP methods
export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
