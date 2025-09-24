import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/auth";
import { decodeJWT } from "@/lib/jwt-utils";

export async function GET(request: NextRequest) {
  try {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    const accessToken = request.headers.get("x-access-token");
    if (!accessToken || !jwtSecret) {
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

    const response = await fetch(
      "https://api.host.langchain.com/v2/auth/providers",
      {
        headers: {
          "x-api-key": process.env.LANGSMITH_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch providers: ${response.status} ${response.statusText}`,
      );
    }

    const providers = await response.json();
    console.log("providers from API", providers);

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error fetching OAuth providers", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
