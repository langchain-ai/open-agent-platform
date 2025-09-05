import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/auth/supabase-client";
import { decodeJWT } from "@/lib/jwt-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

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
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const userId = payload.sub;

    const body = await request.json();
    const { apiKeys } = body;

    if (!apiKeys || typeof apiKeys !== "object") {
      return NextResponse.json(
        { error: "Invalid API keys data" },
        { status: 400 },
      );
    }

    // Filter out null, undefined, or empty string values
    const nonNullApiKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([_, value]) => {
        return value && typeof value === "string" && value.trim() !== "";
      }),
    );

    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { error: upsertError } = await supabase.from("users_config").upsert(
      {
        user_id: userId,
        api_keys: nonNullApiKeys,
      } as any,
      {
        onConflict: "user_id",
      },
    );

    if (upsertError) {
      console.error("Error saving API keys:", upsertError);
      return NextResponse.json(
        { error: "Failed to save API keys" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "API keys saved successfully",
        savedKeys: Object.keys(nonNullApiKeys),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API keys save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
