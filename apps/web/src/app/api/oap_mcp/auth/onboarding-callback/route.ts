import { NextRequest, NextResponse } from "next/server";
import { PublicOAuthClient } from "../../oauth-client";
import { OAuthClientMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";

export const runtime = "edge";

// This endpoint handles the OAuth callback specifically for the onboarding flow
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // Extract the authorization code from the query parameters
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is missing" },
        { status: 400 }
      );
    }

    // Get the server URL from the cookie
    const serverUrl = req.cookies.get("mcp_server_url")?.value;
    
    if (!serverUrl) {
      return NextResponse.json(
        { error: "MCP server URL is missing. Please restart the authentication flow." },
        { status: 400 }
      );
    }

    // Get the client metadata from the environment or use default values
    const clientMetadata: OAuthClientMetadata = {
      client_name: process.env.MCP_CLIENT_NAME || "OAP MCP Client",
      redirect_uris: [
        process.env.MCP_REDIRECT_URI || 
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/oap_mcp/auth/onboarding-callback`,
      ],
    };

    // Create the OAuth client with the server URL from the cookie
    const clientId = process.env.MCP_CLIENT_ID || "mcp_beta";
    const redirectUri = process.env.MCP_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/oap_mcp/auth/onboarding-callback`;

    const authProvider = new PublicOAuthClient(
      clientMetadata,
      clientId,
      redirectUri,
      serverUrl
    );

    // Complete the authentication with the code
    await authProvider.finishAuth(code);

    // Get the access token from the auth provider
    const tokens = authProvider.getTokens();

    if (!tokens || !tokens.access_token) {
      return NextResponse.json(
        { error: "Failed to obtain access token" },
        { status: 500 }
      );
    }

    // Redirect back to the onboarding page with the token
    const onboardingUrl = new URL("/onboarding/mcp", req.url);
    onboardingUrl.searchParams.set("token", tokens.access_token);
    
    // Create the response and clear the server URL cookie
    const response = NextResponse.redirect(onboardingUrl);
    response.cookies.delete("mcp_server_url");

    return response;
  } catch (error) {
    console.error("OAuth onboarding callback error:", error);
    return NextResponse.json(
      { error: "Failed to process OAuth callback", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}