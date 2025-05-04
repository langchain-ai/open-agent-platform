import { NextRequest, NextResponse } from "next/server";
import { PublicOAuthClient } from "../oauth-client";
import { OAuthClientMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    // Get the client metadata from the environment or use default values
    const clientMetadata: OAuthClientMetadata = {
      client_name: process.env.MCP_CLIENT_NAME || "OAP MCP Client",
      redirect_uris: [
        process.env.MCP_REDIRECT_URI || 
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/oap_mcp/auth/callback`,
      ],
    };

    // Create the OAuth client
    const clientId = process.env.MCP_CLIENT_ID || "mcp_beta";
    const redirectUri = process.env.MCP_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/oap_mcp/auth/callback`;

    const authProvider = new PublicOAuthClient(
      clientMetadata,
      clientId,
      redirectUri
    );

    // Generate the authorization URL
    const authUrl = await authProvider.getAuthorizationUrl();

    // Redirect to the authorization URL
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Auth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}