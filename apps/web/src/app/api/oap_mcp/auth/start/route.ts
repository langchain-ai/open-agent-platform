import { NextRequest, NextResponse } from "next/server";
import { PublicOAuthClient } from "../../oauth-client";
import { OAuthClientMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";

export const runtime = "edge";

// Handle POST requests for starting the auth flow with a custom server URL
export async function POST(req: NextRequest) {
  try {
    // Get the server URL from the request body
    const { serverUrl } = await req.json();
    
    if (!serverUrl) {
      return NextResponse.json(
        { error: "MCP server URL is required" },
        { status: 400 }
      );
    }

    // Store the server URL in a cookie so we can use it in the callback
    const response = NextResponse.json({ status: "initializing" });
    response.cookies.set({
      name: "mcp_server_url",
      value: serverUrl,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes - just long enough for auth flow
    });

    // Get the client metadata from the environment or use default values
    const clientMetadata: OAuthClientMetadata = {
      client_name: process.env.MCP_CLIENT_NAME || "OAP MCP Client",
      redirect_uris: [
        process.env.MCP_REDIRECT_URI || 
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/oap_mcp/auth/onboarding-callback`,
      ],
    };

    // Create the OAuth client
    const clientId = process.env.MCP_CLIENT_ID || "mcp_beta";
    const redirectUri = process.env.MCP_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/oap_mcp/auth/onboarding-callback`;

    const authProvider = new PublicOAuthClient(
      clientMetadata,
      clientId,
      redirectUri,
      serverUrl
    );

    // Generate the authorization URL
    const authUrl = await authProvider.getAuthorizationUrl();

    // Return the authorization URL
    return NextResponse.json({
      authUrl: authUrl.toString(),
    }, { status: 200 });
  } catch (error) {
    console.error("Auth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}