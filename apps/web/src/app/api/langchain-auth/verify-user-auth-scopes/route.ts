import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/auth";
import { getSupabaseClient } from "@/lib/auth/supabase-client";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    // Parse the URL and get the code parameter
    const requestUrl = new URL(request.url);
    const providerId = requestUrl.searchParams.get("providerId");
    const rawScopes = requestUrl.searchParams.get("scopes");

    const accessToken = request.headers.get("x-access-token");
    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 400 },
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

    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const client = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
    });

    const authRes = await client.authenticate({
      provider: providerId,
      scopes,
      userId: user.id,
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
