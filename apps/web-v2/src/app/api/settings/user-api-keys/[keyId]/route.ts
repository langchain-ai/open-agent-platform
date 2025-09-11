import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/auth/supabase-client";
import { decodeJWT } from "@/lib/jwt-utils";

function isTokenExpired(exp: number): boolean {
  const currentTime = Date.now() / 1000;
  return currentTime > exp;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
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
    if (!payload || !payload.sub || isTokenExpired(payload.exp)) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const userId = payload.sub;
    const keyId = params.keyId;

    if (!keyId) {
      return NextResponse.json(
        { error: "API key ID is required" },
        { status: 400 },
      );
    }

    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Delete the API key, ensuring it belongs to the authenticated user
    const { error } = await supabase
      .from("user_api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting user API key:", error);
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "API key deleted successfully",
    });
  } catch (error) {
    console.error("User API key deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}