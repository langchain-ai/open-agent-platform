import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { useState } from "react";
import { getMCPServers } from "@/lib/environment/mcp-servers";
import { MCPServerConfiguration, ToolWithServer } from "@/types/mcp";

export interface UseMCPOptions {
  name: string;
  version: string;
  serverName?: string; // Optional: connect to specific server
}

export interface MCPConnection {
  serverName: string;
  client: Client;
  config: MCPServerConfiguration;
}

/**
 * Custom hook for interacting with multiple Model Context Protocol (MCP) servers.
 * Provides functions to connect to MCP servers and manage tools from multiple sources.
 */
export default function useMCP({ name, version, serverName }: UseMCPOptions) {
  const [connections, setConnections] = useState<Map<string, MCPConnection>>(
    new Map()
  );
  const [toolsByServer, setToolsByServer] = useState<
    Map<string, ToolWithServer[]>
  >(new Map());
  const [cursorsByServer, setCursorsByServer] = useState<Map<string, string>>(
    new Map()
  );

  const createAndConnectMCPClient = async (
    serverName: string,
    serverConfig: MCPServerConfiguration
  ): Promise<Client> => {
    if (serverConfig.type === "stdio") {
      // Handle stdio transport (not supported in browser)
      throw new Error("STDIO transport not supported in browser environment");
    }

    // Handle HTTP/SSE transport - use proxy route for same-origin
    const proxyUrl = new URL(window.location.origin);
    proxyUrl.pathname = `/api/oap_mcp/${serverName}`;

    const transport = new StreamableHTTPClientTransport(proxyUrl);
    const client = new Client({ name, version });

    await client.connect(transport);
    return client;
  };

  const getToolsFromServer = async (
    serverName: string,
    nextCursor?: string
  ): Promise<ToolWithServer[]> => {
    const servers = getMCPServers();
    const serverConfig = servers[serverName];

    if (!serverConfig) {
      throw new Error(`Server ${serverName} not found in configuration`);
    }

    let connection = connections.get(serverName);
    if (!connection) {
      const client = await createAndConnectMCPClient(serverName, serverConfig);
      connection = { serverName, client, config: serverConfig };
      setConnections((prev) => new Map(prev).set(serverName, connection!));
    }

    const tools = await connection.client.listTools({ cursor: nextCursor });

    if (tools.nextCursor) {
      setCursorsByServer((prev) =>
        new Map(prev).set(serverName, tools.nextCursor!)
      );
    } else {
      setCursorsByServer((prev) => {
        const next = new Map(prev);
        next.delete(serverName);
        return next;
      });
    }

    return tools.tools.map((tool) => ({
      ...tool,
      serverName,
      serverConfig,
    }));
  };

  const getAllTools = async (): Promise<ToolWithServer[]> => {
    const servers = getMCPServers();
    const allTools: ToolWithServer[] = [];

    await Promise.all(
      Object.keys(servers).map(async (serverName) => {
        try {
          const tools = await getToolsFromServer(serverName);
          allTools.push(...tools);
        } catch (e) {
          console.error(`Failed to get tools from ${serverName}:`, e);
        }
      })
    );

    return allTools;
  };

  const callTool = async ({
    name,
    args,
    version,
    serverName: specificServer,
  }: {
    name: string;
    args: Record<string, any>;
    version?: string;
    serverName?: string;
  }) => {
    // Find which server has this tool
    let targetServer = specificServer;

    if (!targetServer) {
      for (const [server, tools] of toolsByServer.entries()) {
        if (tools.some((t) => t.name === name)) {
          targetServer = server;
          break;
        }
      }
    }

    if (!targetServer) {
      throw new Error(`Tool ${name} not found in any server`);
    }

    const connection = connections.get(targetServer);
    if (!connection) {
      throw new Error(`Not connected to server ${targetServer}`);
    }

    return connection.client.callTool({ name, version, arguments: args });
  };

  // Legacy compatibility - maintain old interface
  const tools = Array.from(toolsByServer.values()).flat();
  const setTools = (newTools: ToolWithServer[]) => {
    const newMap = new Map<string, ToolWithServer[]>();
    newTools.forEach((tool) => {
      const serverTools = newMap.get(tool.serverName) || [];
      serverTools.push(tool);
      newMap.set(tool.serverName, serverTools);
    });
    setToolsByServer(newMap);
  };

  // Legacy single cursor - returns first server's cursor
  const cursor = Array.from(cursorsByServer.values())[0] || "";

  return {
    getToolsFromServer,
    getAllTools,
    callTool,
    toolsByServer,
    setToolsByServer,
    cursorsByServer,
    connections,
    // Legacy compatibility
    getTools: getAllTools,
    createAndConnectMCPClient: () =>
      createAndConnectMCPClient("default", getMCPServers().default),
    tools,
    setTools,
    cursor,
  };
}

