import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/auth";
import { decodeJWT } from "@/lib/jwt-utils";

export async function GET(request: NextRequest) {
  try {
    // Parse the URL and get the code parameter
    const requestUrl = new URL(request.url);
    const providerId = requestUrl.searchParams.get("providerId");
    const rawScopes = requestUrl.searchParams.get("scopes");

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    const accessToken = request.headers.get("x-access-token");
    if (!accessToken || !jwtSecret) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!providerId || !rawScopes) {
      return NextResponse.json(
        { error: "Missing providerId or scopes" },
        { status: 400 },
      );
    }
    const scopes = rawScopes.split(",");
    if (!scopes.length) {
      return NextResponse.json(
        { error: "No scopes provided" },
        { status: 400 },
      );
    }

    const payload = decodeJWT(accessToken, jwtSecret);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const client = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
    });

    const authRes = await client.authenticate({
      provider: providerId,
      scopes,
      userId: payload.sub,
    });

    if (authRes.authUrl) {
      return NextResponse.json(
        { authUrl: authRes.authUrl, success: false },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying user auth scopes", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
