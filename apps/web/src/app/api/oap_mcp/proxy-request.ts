import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { McpServerConfig } from "@/types/mcp-server";

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
const SUPABASE_AUTH_MCP = process.env.NEXT_PUBLIC_SUPABASE_AUTH_MCP === "true";

async function getSupabaseSessionInfo(req: NextRequest) {
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

    return session ? { accessToken: session.access_token, supabase, userId: session.user?.id } : null;
  } catch {
    return null;
  }
}

async function getUserMcpServerConfig(supabase: any, userId: string): Promise<McpServerConfig | null> {
  try {
    const { data, error } = await supabase
      .from("users_config")
      .select("mcp_servers")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
      console.error("Error fetching user MCP server config:", error);
      return null;
    }

    return data?.mcp_servers || null;
  } catch (error) {
    console.error("Error getting user MCP server config:", error);
    return null;
  }
}

export async function proxyRequest(req: NextRequest): Promise<Response> {
  const sessionInfo = await getSupabaseSessionInfo(req);
  let mcpServerUrl = MCP_SERVER_URL;
  let useCustomAuth = false;
  let customAuthHeaders: Record<string, string> = {};

  // Try to get user's custom MCP server configuration
  if (sessionInfo?.supabase && sessionInfo?.userId) {
    const userMcpConfig = await getUserMcpServerConfig(sessionInfo.supabase, sessionInfo.userId);
    if (userMcpConfig && userMcpConfig.url) {
      mcpServerUrl = userMcpConfig.url;
      useCustomAuth = true;
      customAuthHeaders = userMcpConfig.auth || {};
    }
  }

  if (!mcpServerUrl) {
    return new Response(
      JSON.stringify({ message: "MCP server URL not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/oap_mcp\/?/, "");
  const baseUrl = mcpServerUrl.replace(/\/$/, "");
  const targetUrl = `${baseUrl}/mcp${path ? "/" + path : ""}${url.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.append(key, value);
    }
  });

  // Apply authentication logic
  if (useCustomAuth) {
    // Use custom auth headers if user has configured custom MCP server
    Object.entries(customAuthHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // Always include LangSmith API key and Supabase user ID for custom tool servers
    if (process.env.LANGSMITH_API_KEY) {
      headers.set("x-api-key", process.env.LANGSMITH_API_KEY);
    } else {
      console.warn("LANGSMITH_API_KEY not available for custom tool server request");
    }

    if (sessionInfo?.userId) {
      headers.set("x-supabase-user-id", sessionInfo.userId);
    } else {
      console.warn("Supabase user ID not available for custom tool server request");
    }
  } else if (SUPABASE_AUTH_MCP) {
    // Use existing supabase auth for default MCP server
    const supabaseToken = sessionInfo?.accessToken;

    if (supabaseToken) {
      headers.set("Authorization", `Bearer ${supabaseToken}`);
    } else {
      return new Response(
        JSON.stringify({ message: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  headers.set("Accept", "application/json, text/event-stream");

  const body =
    req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseClone = response.clone();
    let newResponse: NextResponse;

    if (response.status === 204) {
      newResponse = new NextResponse(null, { status: 204 });
    } else {
      try {
        const responseData = await responseClone.json();
        newResponse = NextResponse.json(responseData, {
          status: response.status,
          statusText: response.statusText,
        });
      } catch (_) {
        const responseBody = await response.text();
        newResponse = new NextResponse(responseBody, {
          status: response.status,
          statusText: response.statusText,
        });
      }
    }

    response.headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ message: "Proxy request failed", error: errorMessage }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
