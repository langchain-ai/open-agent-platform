import { NextRequest, NextResponse } from "next/server";
import { decodeJWT } from "@/lib/jwt-utils";

export async function GET(request: NextRequest) {
  try {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    const langsmithApiKey = process.env.LANGSMITH_API_KEY;
    const accessToken = request.headers.get("x-access-token");

    if (!accessToken || !jwtSecret) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!langsmithApiKey) {
      return NextResponse.json(
        { error: "LANGSMITH_API_KEY environment variable is not configured" },
        { status: 500 },
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
          "x-api-key": langsmithApiKey,
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
    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error fetching OAuth providers", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
