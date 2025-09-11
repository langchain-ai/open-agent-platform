import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/auth/supabase-client";
import { decodeJWT } from "@/lib/jwt-utils";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

function generateApiKey(): string {
  const prefix = "oap_";
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isTokenExpired(exp: number): boolean {
  const currentTime = Date.now() / 1000;
  return currentTime > exp;
}

function encryptApiKey(apiKey: string): string {
  const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("Encryption key not found");
  }
  return encryptSecret(apiKey, encryptionKey);
}

function decryptApiKey(encryptedApiKey: string): string {
  const encryptionKey = process.env.SECRETS_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("Encryption key not found");
  }
  return decryptSecret(encryptedApiKey, encryptionKey);
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
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "API key name is required" },
        { status: 400 },
      );
    }

    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Generate a new API key
    const apiKey = generateApiKey();
    const encryptedApiKey = encryptApiKey(apiKey);

    // Insert into user_api_keys table
    const { data, error } = await supabase
      .from("user_api_keys")
      .insert({
        user_id: userId,
        name: name.trim(),
        key_hash: encryptedApiKey,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user API key:", error);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "API key created successfully",
      apiKey: {
        id: data.id,
        name: data.name,
        key: apiKey, // Return the plain key only on creation
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("User API key creation error:", error);
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
      .from("user_api_keys")
      .select("id, name, key_hash, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user API keys:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 },
      );
    }

    // Decrypt the API keys for display
    const apiKeys = data.map((key) => ({
      id: key.id,
      name: key.name,
      key: decryptApiKey(key.key_hash),
      created_at: key.created_at,
    }));

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("User API key fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}