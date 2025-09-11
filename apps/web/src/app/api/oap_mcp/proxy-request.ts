import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

    return session ? { accessToken: session.access_token } : null;
  } catch {
    return null;
  }
}

export async function proxyRequest(req: NextRequest): Promise<Response> {
  if (!MCP_SERVER_URL) {
    return new Response(
      JSON.stringify({ message: "MCP_SERVER_URL not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/oap_mcp\/?/, "");
  const baseUrl = MCP_SERVER_URL.replace(/\/$/, "");
  const targetUrl = `${baseUrl}/mcp${path ? "/" + path : ""}${url.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.append(key, value);
    }
  });

  if (SUPABASE_AUTH_MCP) {
    const sessionInfo = await getSupabaseSessionInfo(req);
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
