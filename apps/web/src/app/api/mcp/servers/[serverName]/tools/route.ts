import { NextRequest, NextResponse } from "next/server";
import { getMCPServer } from "@/lib/environment/mcp-servers";
import { createServerClient } from "@supabase/ssr";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export const runtime = "edge";

async function getSupabaseToken(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || null;
  } catch (error) {
    console.error("Error getting Supabase token:", error);
    return null;
  }
}

async function getAuthHeaders(
  serverConfig: any,
  supabaseToken: string | null,
): Promise<Headers> {
  const headers = new Headers();

  if (!serverConfig.authProvider) {
    return headers;
  }

  switch (serverConfig.authProvider.type) {
    case "bearer":
      if (supabaseToken) {
        headers.set("Authorization", `Bearer ${supabaseToken}`);
      }
      break;
    case "api-key":
      if (serverConfig.authProvider.apiKey) {
        headers.set("X-API-Key", serverConfig.authProvider.apiKey);
      }
      break;
    case "oauth":
      // OAuth flow would require additional implementation
      console.warn("OAuth authentication not yet implemented for MCP servers");
      break;
  }

  return headers;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ serverName: string }> },
) {
  try {
    const { serverName } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;

    // Get server configuration
    const serverConfig = getMCPServer(serverName);
    if (!serverConfig) {
      return NextResponse.json(
        { error: `Server '${serverName}' not found` },
        { status: 404 },
      );
    }

    // Get authentication if needed
    const supabaseToken = await getSupabaseToken(req);
    const authHeaders = await getAuthHeaders(serverConfig, supabaseToken);

    // Create MCP client with appropriate transport
    const url = new URL(serverConfig.url);
    const transport = new StreamableHTTPClientTransport(url, {
      headers: Object.fromEntries(authHeaders.entries()),
    });

    const client = new Client({
      name: "Multi-Server MCP Client",
      version: "1.0.0",
    });

    await client.connect(transport);

    // List tools from this server
    const toolsResponse = await client.listTools({ cursor });

    // Close the connection
    await client.close();

    // Add server information to each tool
    const toolsWithServer = toolsResponse.tools.map((tool) => ({
      ...tool,
      serverName,
      serverConfig: {
        type: serverConfig.type,
        transport: serverConfig.transport,
        url: serverConfig.url,
      },
    }));

    return NextResponse.json({
      tools: toolsWithServer,
      nextCursor: toolsResponse.nextCursor,
    });
  } catch (error) {
    console.error("Error listing MCP tools:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list tools", details: errorMessage },
      { status: 500 },
    );
  }
}

