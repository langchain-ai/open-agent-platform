import { NextRequest, NextResponse } from "next/server";
import { PublicOAuthClient } from "../../oauth-client";
import { OAuthClientMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Extract the refresh token from the request if available
    const { refresh_token } = await req.json();

    // If no refresh token is provided, try to get it from cookies
    const cookieRefreshToken = req.cookies.get("mcp_refresh_token")?.value;
    
    // Use provided refresh token or cookie refresh token
    const tokenToUse = refresh_token || cookieRefreshToken;

    if (!tokenToUse) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 400 }
      );
    }

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

    // Refresh the token
    await authProvider.refreshToken(tokenToUse);
    
    // Get the new tokens
    const tokens = authProvider.getTokens();

    if (!tokens || !tokens.access_token) {
      return NextResponse.json(
        { error: "Failed to refresh token" },
        { status: 500 }
      );
    }

    // Create the response with the new tokens
    const response = NextResponse.json({ 
      access_token: tokens.access_token,
      token_type: "Bearer",
      expires_in: tokens.expires_in,
    });
    
    // Update the cookies with the new tokens
    response.cookies.set({
      name: "mcp_access_token",
      value: tokens.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    if (tokens.refresh_token) {
      response.cookies.set({
        name: "mcp_refresh_token",
        value: tokens.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}