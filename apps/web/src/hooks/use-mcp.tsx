import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Tool } from "@/types/tool";
import { useState } from "react";

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

  /**
   * Creates an MCP client and connects it to the specified server URL.
   * @param url - The URL of the MCP server.
   * @param options - Client identification options.
   * @param options.name - The name of the client.
   * @param options.version - The version of the client.
   * @returns A promise that resolves to the connected MCP client instance.
   */
  const createAndConnectMCPClient = async () => {
    const url = getMCPUrlOrThrow();
    const connectionClient = new StreamableHTTPClientTransport(new URL(url));
    const mcp = new Client({
      name,
      version,
    });

    await mcp.connect(connectionClient);
    return mcp;
  };

  /**
   * Connects to an MCP server and retrieves the list of available tools.
   * @param url - The URL of the MCP server.
   * @param options - Client identification options.
   * @param options.name - The name of the client.
   * @param options.version - The version of the client.
   * @returns A promise that resolves to an array of available tools.
   */
  const getTools = async (nextCursor?: string): Promise<Tool[]> => {
    const mcp = await createAndConnectMCPClient();
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
   * @param version - The version of the tool. Optional.
   * @param args - The arguments to pass to the tool.
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
    const mcp = await createAndConnectMCPClient();
    const response = await mcp.callTool({
      name,
      version,
      arguments: args,
    });
    return response;
  };

  return {
    getTools,
    callTool,
    createAndConnectMCPClient,
    tools,
    setTools,
    cursor,
  };
}
