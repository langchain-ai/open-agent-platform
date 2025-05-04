"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function MCPOnboardingPage() {
  const [serverUrl, setServerUrl] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check for auth callback with token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
      // Clean URL without reloading page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStartAuth = async () => {
    if (!serverUrl) {
      toast.error("Please enter an MCP server URL");
      return;
    }

    try {
      setIsAuthenticating(true);
      
      // Save the server URL to local storage so we can retrieve it after auth redirect
      localStorage.setItem("mcp_server_url", serverUrl);
      
      // Start the auth flow by redirecting to our backend API
      // The API will handle the actual OAuth redirect
      const response = await fetch("/api/oap_mcp/auth/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverUrl }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start authentication flow");
      }
      
      const data = await response.json();
      
      // Redirect to the authorization URL
      window.location.href = data.authUrl;
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Authentication failed: " + (error instanceof Error ? error.message : "Unknown error"));
      setIsAuthenticating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(accessToken)
      .then(() => {
        toast.success("Token copied to clipboard");
      })
      .catch((error) => {
        console.error("Failed to copy token:", error);
        toast.error("Failed to copy token to clipboard");
      });
  };

  return (
    <div className="container max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">MCP Server Onboarding</h1>
      
      <Card className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Connect to your MCP Server</h2>
          <p className="text-gray-600 mb-6">
            Provide your Model Context Protocol (MCP) server URL and authenticate to generate an access token.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="server-url">MCP Server URL</Label>
              <Input
                id="server-url"
                placeholder="https://your-mcp-server.com/v1/mcps/beta/mcp"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={isAuthenticating || isAuthenticated}
              />
              <p className="text-sm text-gray-500">
                Example: https://api.arcade.dev/v1/mcps/beta/mcp
              </p>
            </div>

            {!isAuthenticated && (
              <Button 
                onClick={handleStartAuth} 
                disabled={isAuthenticating || !serverUrl}
                className="w-full"
              >
                {isAuthenticating ? "Authenticating..." : "Start Authentication"}
              </Button>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <>
            <Separator className="my-6" />
            
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Authentication Successful</h2>
              <p className="text-gray-600 mb-6">
                Copy the access token below and add it to your <code>.env</code> file as <code>MCP_SERVER_ACCESS_TOKEN</code>.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="access-token"
                    value={accessToken}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyToClipboard} className="flex-shrink-0">
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Next Steps</h3>
              <ol className="list-decimal ml-5 text-yellow-700">
                <li className="mb-2">Add this token to your <code>.env</code> file as <code>MCP_SERVER_ACCESS_TOKEN</code></li>
                <li className="mb-2">Add your MCP server URL to your <code>.env</code> file as <code>MCP_SERVER_URL</code></li>
                <li>Restart your application to apply the changes</li>
              </ol>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}