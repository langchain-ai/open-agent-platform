import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Tool } from "@/types/tool";
import { useState, useRef, useEffect } from "react";

function getMCPUrlOrThrow() {
  if (!process.env.NEXT_PUBLIC_BASE_API_URL) {
    throw new Error("NEXT_PUBLIC_BASE_API_URL is not defined");
  }

  const url = new URL(process.env.NEXT_PUBLIC_BASE_API_URL);
  url.pathname = `${url.pathname}${url.pathname.endsWith("/") ? "" : "/"}oap_mcp`;
  return url;
}

/**
 * Custom hook for interacting with the Model Context Protocol (MCP).
 * Provides functions to connect to an MCP server and list available tools.
 */
export default function useMCP({
  name,
  version,
}: {
  name: string;
  version: string;
}) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [cursor, setCursor] = useState("");

  // CRITICAL FIX: Cache MCP client to maintain stable session across tool calls
  // Previously: new Client created per call → new session ID → workspace bindings lost
  // Now: Single Client instance reused → same session ID → workspace persists
  const mcpClientRef = useRef<Client | null>(null);

  /**
   * Get or create MCP client (cached for session stability).
   *
   * IMPORTANT: The MCP SDK Client generates a new session UUID on each instantiation.
   * Creating a new client for every tool call causes:
   * - New session ID sent in mcp-session-id header
   * - Server creates new session, can't find previous workspace bindings
   * - select_project() and subsequent calls see different sessions
   *
   * Solution: Create client ONCE per component lifecycle, reuse for all calls.
   */
  const getOrCreateClient = async (): Promise<Client> => {
    // Return cached client if available
    if (mcpClientRef.current) {
      return mcpClientRef.current;
    }

    // Create new client and cache it
    const url = getMCPUrlOrThrow();
    const connectionClient = new StreamableHTTPClientTransport(new URL(url));
    const mcp = new Client({
      name,
      version,
    });

    await mcp.connect(connectionClient);

    // Cache for future calls
    mcpClientRef.current = mcp;

    return mcp;
  };

  /**
   * Connects to an MCP server and retrieves the list of available tools.
   * @param nextCursor - Optional cursor for pagination
   * @returns A promise that resolves to an array of available tools.
   */
  const getTools = async (nextCursor?: string): Promise<Tool[]> => {
    const mcp = await getOrCreateClient(); // ← REUSES cached client
    const tools = await mcp.listTools({ cursor: nextCursor });
    if (tools.nextCursor) {
      setCursor(tools.nextCursor);
    } else {
      setCursor("");
    }
    return tools.tools;
  };

  /**
   * Calls a tool on the MCP server.
   * @param name - The name of the tool.
   * @param args - The arguments to pass to the tool.
   * @param version - The version of the tool. Optional.
   * @returns A promise that resolves to the response from the tool.
   */
  const callTool = async ({
    name,
    args,
    version,
  }: {
    name: string;
    args: Record<string, any>;
    version?: string;
  }) => {
    const mcp = await getOrCreateClient(); // ← REUSES cached client
    const response = await mcp.callTool({
      name,
      version,
      arguments: args,
    });
    return response;
  };

  // Cleanup: Close client connection when component unmounts
  useEffect(() => {
    return () => {
      if (mcpClientRef.current) {
        // Close the MCP client connection
        mcpClientRef.current.close?.();
        mcpClientRef.current = null;
      }
    };
  }, []); // Empty deps = run cleanup only on unmount

  return {
    getTools,
    callTool,
    createAndConnectMCPClient: getOrCreateClient, // Keep old name for backwards compatibility
    tools,
    setTools,
    cursor,
  };
}
