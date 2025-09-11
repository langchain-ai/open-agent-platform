import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/auth/supabase-client";
import { decodeJWT } from "@/lib/jwt-utils";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

function encryptApiKeys(
  apiKeys: Record<string, string>,
): Record<string, string> {
  const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("Encryption key not found");
  }

  const encryptedApiKeys = Object.fromEntries(
    Object.entries(apiKeys).map(([key, value]) => {
      return [key, encryptSecret(value, encryptionKey)];
    }),
  );
  return encryptedApiKeys;
}

function decryptApiKeys(
  apiKeys: Record<string, string>,
): Record<string, string> {
  const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("Encryption key not found");
  }

  const decryptedApiKeys = Object.fromEntries(
    Object.entries(apiKeys).map(([key, value]) => {
      return [key, decryptSecret(value, encryptionKey)];
    }),
  );
  return decryptedApiKeys;
}

function isTokenExpired(exp: number): boolean {
  const currentTime = Date.now() / 1000;
  return currentTime > exp;
}

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
    if (!payload || !payload.sub || isTokenExpired(payload.exp)) {
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
      Object.entries<string>(apiKeys).filter(([_, value]) => {
        return value && typeof value === "string" && value.trim() !== "";
      }),
    );
    const encryptedApiKeys = encryptApiKeys(nonNullApiKeys);

    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { error: upsertError } = await supabase.from("users_config").upsert(
      {
        user_id: userId,
        api_keys: encryptedApiKeys,
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

export async function GET(request: NextRequest) {
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

    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const { data, error } = await supabase
      .from("users_config")
      .select("api_keys")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      return NextResponse.json({ error: "No API keys found" }, { status: 404 });
    }

    if (!data || error) {
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 },
      );
    }

    if (!("api_keys" in data)) {
      return NextResponse.json(
        { error: "API keys not found" },
        { status: 404 },
      );
    }

    const encryptedApiKeys = (data as Record<string, any>).api_keys;
    const decryptedApiKeys = decryptApiKeys(encryptedApiKeys);

    return NextResponse.json(
      {
        apiKeys: decryptedApiKeys,
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
