import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/auth/supabase-client";
import { decodeJWT } from "@/lib/jwt-utils";
import { McpServerConfig } from "@/types/mcp-server";
import { isTokenExpired } from "@/app/api/settings/utils/token-expired";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const accessToken = request.headers.get("x-access-token");
    const refreshToken = request.headers.get("x-refresh-token");
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!accessToken || !refreshToken || !jwtSecret) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const payload = decodeJWT(accessToken, jwtSecret);
    if (!payload || !payload.sub || isTokenExpired(payload.exp)) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const userId = payload.sub;

    const body = await request.json();
    const { mcpServer } = body as { mcpServer: McpServerConfig };

    if (!mcpServer || typeof mcpServer !== "object") {
      return NextResponse.json(
        { error: "Invalid MCP server configuration data" },
        { status: 400 },
      );
    }

    // Validate the URL
    if (
      !mcpServer.url ||
      typeof mcpServer.url !== "string" ||
      mcpServer.url.trim() === ""
    ) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(mcpServer.url.trim());
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Validate auth headers
    if (!mcpServer.auth || typeof mcpServer.auth !== "object") {
      return NextResponse.json(
        { error: "Invalid auth headers" },
        { status: 400 },
      );
    }

    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { error: upsertError } = await supabase.from("users_config").upsert(
      {
        user_id: userId,
        mcp_servers: mcpServer as Record<string, any>,
      },
      {
        onConflict: "user_id",
      },
    );

    if (upsertError) {
      console.error("Error saving MCP server configuration:", upsertError);
      return NextResponse.json(
        { error: "Failed to save MCP server configuration" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "MCP server configuration saved successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("MCP server configuration save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const accessToken = request.headers.get("x-access-token");
    const refreshToken = request.headers.get("x-refresh-token");
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!accessToken || !refreshToken || !jwtSecret) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const payload = decodeJWT(accessToken, jwtSecret);
    if (!payload || !payload.sub || isTokenExpired(payload.exp)) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const userId = payload.sub;

    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { data, error } = await supabase
      .from("users_config")
      .select("mcp_servers")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching MCP server configuration:", error);
      return NextResponse.json(
        { error: "Failed to fetch MCP server configuration" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        mcpServer: data?.mcp_servers || null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("MCP server configuration fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
