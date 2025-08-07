import { useState, useCallback, useRef } from "react";
import { Tool } from "@/types/tool";
import {
  MCPServersConfig,
  MCPConnection,
  ServerError,
  ServerAuthState,
  ToolWithServer,
  MCPServerHTTPConfig,
} from "@/types/mcp";
import {
  getMCPServers,
  getMCPServer,
  getMCPServerNames,
} from "@/lib/environment/mcp-servers";

interface MultiServerMCPState {
  connections: Map<string, MCPConnection>;
  tools: Map<string, ToolWithServer[]>;
  errors: Map<string, ServerError>;
  authStates: Map<string, ServerAuthState>;
  loading: Map<string, boolean>;
}

/**
 * Custom hook for managing multiple MCP server connections.
 * Provides functionality to connect to multiple servers, list tools, and execute tools.
 */
export default function useMultiServerMCP() {
  const [state, setState] = useState<MultiServerMCPState>({
    connections: new Map(),
    tools: new Map(),
    errors: new Map(),
    authStates: new Map(),
    loading: new Map(),
  });

  const connectionsRef = useRef<Map<string, MCPConnection>>(new Map());

  /**
   * Get all configured MCP servers
   */
  const getServers = useCallback((): MCPServersConfig => {
    return getMCPServers();
  }, []);

  /**
   * Check if a server is connected
   */
  const isServerConnected = useCallback(
    (serverName: string): boolean => {
      return state.connections.has(serverName);
    },
    [state.connections],
  );

  /**
   * Get loading state for a server
   */
  const isServerLoading = useCallback(
    (serverName: string): boolean => {
      return state.loading.get(serverName) || false;
    },
    [state.loading],
  );

  /**
   * Get error for a server
   */
  const getServerError = useCallback(
    (serverName: string): ServerError | undefined => {
      return state.errors.get(serverName);
    },
    [state.errors],
  );

  /**
   * Connect to a specific MCP server
   */
  const connectToServer = useCallback(
    async (serverName: string): Promise<boolean> => {
      const serverConfig = getMCPServer(serverName);
      if (!serverConfig) {
        setState((prev) => ({
          ...prev,
          errors: new Map(prev.errors).set(serverName, {
            serverName,
            error: new Error(
              `Server configuration not found for ${serverName}`,
            ),
            retryable: false,
            lastAttempt: new Date(),
          }),
        }));
        return false;
      }

      // Set loading state
      setState((prev) => ({
        ...prev,
        loading: new Map(prev.loading).set(serverName, true),
      }));

      try {
        // For now, we'll use the API routes to interact with servers
        // The actual connection is handled by the API routes
        const connection: MCPConnection = {
          serverName,
          client: null, // Client is managed server-side
          config: serverConfig,
        };

        connectionsRef.current.set(serverName, connection);

        setState((prev) => ({
          ...prev,
          connections: new Map(prev.connections).set(serverName, connection),
          loading: new Map(prev.loading).set(serverName, false),
          errors: (() => {
            const newErrors = new Map(prev.errors);
            newErrors.delete(serverName);
            return newErrors;
          })(),
        }));

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: new Map(prev.loading).set(serverName, false),
          errors: new Map(prev.errors).set(serverName, {
            serverName,
            error: error instanceof Error ? error : new Error("Unknown error"),
            retryable: true,
            lastAttempt: new Date(),
          }),
        }));
        return false;
      }
    },
    [],
  );

  /**
   * Disconnect from a specific MCP server
   */
  const disconnectFromServer = useCallback((serverName: string): void => {
    connectionsRef.current.delete(serverName);
    setState((prev) => ({
      ...prev,
      connections: (() => {
        const newConnections = new Map(prev.connections);
        newConnections.delete(serverName);
        return newConnections;
      })(),
      tools: (() => {
        const newTools = new Map(prev.tools);
        newTools.delete(serverName);
        return newTools;
      })(),
      errors: (() => {
        const newErrors = new Map(prev.errors);
        newErrors.delete(serverName);
        return newErrors;
      })(),
      authStates: (() => {
        const newAuthStates = new Map(prev.authStates);
        newAuthStates.delete(serverName);
        return newAuthStates;
      })(),
      loading: (() => {
        const newLoading = new Map(prev.loading);
        newLoading.delete(serverName);
        return newLoading;
      })(),
    }));
  }, []);

  /**
   * Connect to all configured servers
   */
  const connectToAllServers = useCallback(async (): Promise<void> => {
    const serverNames = getMCPServerNames();
    await Promise.all(serverNames.map((name) => connectToServer(name)));
  }, [connectToServer]);

  /**
   * List tools from a specific server
   */
  const getToolsFromServer = useCallback(
    async (serverName: string, cursor?: string): Promise<ToolWithServer[]> => {
      if (!isServerConnected(serverName)) {
        const connected = await connectToServer(serverName);
        if (!connected) {
          throw new Error(`Failed to connect to server ${serverName}`);
        }
      }

      setState((prev) => ({
        ...prev,
        loading: new Map(prev.loading).set(serverName, true),
      }));

      try {
        const response = await fetch(
          `/api/mcp/servers/${encodeURIComponent(serverName)}/tools${
            cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
          }`,
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to fetch tools");
        }

        const data = await response.json();
        const tools = data.tools as ToolWithServer[];

        setState((prev) => ({
          ...prev,
          tools: new Map(prev.tools).set(serverName, tools),
          loading: new Map(prev.loading).set(serverName, false),
        }));

        return tools;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: new Map(prev.loading).set(serverName, false),
          errors: new Map(prev.errors).set(serverName, {
            serverName,
            error: error instanceof Error ? error : new Error("Unknown error"),
            retryable: true,
            lastAttempt: new Date(),
          }),
        }));
        throw error;
      }
    },
    [isServerConnected, connectToServer],
  );

  /**
   * Get tools from all connected servers
   */
  const getAllTools = useCallback(async (): Promise<ToolWithServer[]> => {
    const serverNames = getMCPServerNames();
    const toolsPromises = serverNames.map((name) =>
      getToolsFromServer(name).catch((error) => {
        console.error(`Failed to get tools from server ${name}:`, error);
        return [];
      }),
    );

    const toolsArrays = await Promise.all(toolsPromises);
    return toolsArrays.flat();
  }, [getToolsFromServer]);

  /**
   * Call a tool on a specific server
   */
  const callTool = useCallback(
    async ({
      serverName,
      toolName,
      args,
      version,
    }: {
      serverName: string;
      toolName: string;
      args: Record<string, any>;
      version?: string;
    }) => {
      if (!isServerConnected(serverName)) {
        const connected = await connectToServer(serverName);
        if (!connected) {
          throw new Error(`Failed to connect to server ${serverName}`);
        }
      }

      try {
        const response = await fetch(
          `/api/mcp/servers/${encodeURIComponent(
            serverName,
          )}/tools/${encodeURIComponent(toolName)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ args, version }),
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to call tool");
        }

        return await response.json();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          errors: new Map(prev.errors).set(serverName, {
            serverName,
            error: error instanceof Error ? error : new Error("Unknown error"),
            retryable: true,
            lastAttempt: new Date(),
          }),
        }));
        throw error;
      }
    },
    [isServerConnected, connectToServer],
  );

  /**
   * Update authentication state for a server
   */
  const updateAuthState = useCallback(
    (serverName: string, authState: Partial<ServerAuthState>): void => {
      setState((prev) => {
        const currentAuth = prev.authStates.get(serverName) || { serverName };
        return {
          ...prev,
          authStates: new Map(prev.authStates).set(serverName, {
            ...currentAuth,
            ...authState,
          }),
        };
      });
    },
    [],
  );

  /**
   * Clear error for a server
   */
  const clearServerError = useCallback((serverName: string): void => {
    setState((prev) => ({
      ...prev,
      errors: (() => {
        const newErrors = new Map(prev.errors);
        newErrors.delete(serverName);
        return newErrors;
      })(),
    }));
  }, []);

  return {
    // State
    connections: state.connections,
    tools: state.tools,
    errors: state.errors,
    authStates: state.authStates,
    loading: state.loading,

    // Server management
    getServers,
    connectToServer,
    disconnectFromServer,
    connectToAllServers,
    isServerConnected,
    isServerLoading,
    getServerError,

    // Tools
    getToolsFromServer,
    getAllTools,
    callTool,

    // Auth
    updateAuthState,

    // Errors
    clearServerError,
  };
}
