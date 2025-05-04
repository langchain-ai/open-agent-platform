import { NextRequest, NextResponse } from "next/server";
import { PublicOAuthClient } from "../../oauth-client";
import { OAuthClientMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";

export const runtime = "edge";

// This endpoint handles the OAuth callback from the MCP server
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // Extract the authorization code from the query parameters
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is missing" },
        { status: 400 }
      );
    }

    // Set up our MCP client with OAuth support
    //const serverUrl = "https://api.arcade.dev/v1/mcps/beta/mcp";
    const serverUrl = "http://localhost:9099/v1/mcps/beta/mcp";

    const clientMetadata: OAuthClientMetadata = {
        client_name: "My MCP Client",
        redirect_uris: ["http://localhost:3000/callback"],
    };

    // PublicOAuthClient will go away eventually, but for now it's required
    // because the MCP TS SDK hasn't been fully updated to support the new MCP auth spec.
    const authProvider = new PublicOAuthClient(
        clientMetadata,
        "mcp_beta",
        "http://localhost:3000/callback"
    );

    let transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
        authProvider,
        requestInit: {
            headers: { Accept: "application/json" }
        }
    });

    const client = new Client({
        name: "example-client",
        version: "1.0.0",
    });
    console.log("Connecting to MCP...");

    try {
        // This will likely fail with UnauthorizedError
        try {
            await client.connect(transport);
            console.log("Connected without auth (unusual)");
        } catch (error: any) {
            if (error instanceof UnauthorizedError) {
                console.log("Authentication required, waiting for callback...");

                // Complete the authentication with the code
                await transport.finishAuth(code);
                console.log("Auth complete");

                // Need to rebuild the transport (to reset it), but the authProvider is persistent
                transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
                    authProvider,
                    requestInit: {
                        headers: { Accept: "application/json" }
                    }
                });

                // Now try connecting again
                console.log("Connecting to MCP...");
                await client.connect(transport);
                console.log("Connected to MCP");
            } else {
                throw error;
            }
        }

        // List available tools
        console.log("Listing tools");
        const toolsResult = await client.listTools();

        console.log(`Available tools (${toolsResult.tools.length} tools):`);
        for (const tool of toolsResult.tools) {
            const firstLineOfDescription = tool.description?.split("\n")[0];
            console.log(`  - ${tool.name} (${firstLineOfDescription})`);
        }

        // Call a tool
        console.log("Calling tool math_multiply");
        await callTool(client, "math_multiply", {
            a: "2",
            b: "3",
        });

        console.log("Done! Goodbye");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
        callbackServer.close();
        process.exit(0);
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { error: "Failed to process OAuth callback" },
      { status: 500 }
    );
  }
}