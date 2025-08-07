import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import useMultiServerMCP from "@/hooks/use-multi-server-mcp";
import { ToolWithServer } from "@/types/mcp";
import { Tool } from "@/types/tool";

type MultiServerMCPContextType = ReturnType<typeof useMultiServerMCP> & {
  // Aggregated data
  allTools: ToolWithServer[];
  isLoading: boolean;

  // Compatibility methods for existing code
  getTools: (nextCursor?: string) => Promise<Tool[]>;
  callTool: (params: {
    name: string;
    args: Record<string, any>;
    version?: string;
  }) => Promise<any>;
  setTools: (tools: Tool[]) => void;
  tools: Tool[];
  cursor: string;
};

const MultiServerMCPContext = createContext<MultiServerMCPContextType | null>(
  null,
);

export const MultiServerMCPProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const multiServerMCP = useMultiServerMCP();
  const firstRequestMade = useRef(false);
  const [allTools, setAllTools] = useState<ToolWithServer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState("");

  // Initialize connections to all configured servers on mount
  useEffect(() => {
    if (firstRequestMade.current) return;
    firstRequestMade.current = true;

    const initializeServers = async () => {
      setIsLoading(true);
      try {
        // Connect to all configured servers
        await multiServerMCP.connectToAllServers();

        // Fetch tools from all servers
        const tools = await multiServerMCP.getAllTools();
        setAllTools(tools);
      } catch (error) {
        console.error("Failed to initialize MCP servers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeServers();
  }, [multiServerMCP]);

  // Update allTools when individual server tools change
  useEffect(() => {
    const aggregatedTools: ToolWithServer[] = [];
    multiServerMCP.tools.forEach((serverTools) => {
      aggregatedTools.push(...serverTools);
    });
    setAllTools(aggregatedTools);
  }, [multiServerMCP.tools]);

  // Compatibility method: getTools
  // This maintains compatibility with existing code that expects a single server
  const getTools = useCallback(
    async (nextCursor?: string): Promise<Tool[]> => {
      try {
        const tools = await multiServerMCP.getAllTools();
        // Convert ToolWithServer[] to Tool[] for compatibility
        return tools.map(
          ({ serverName, serverConfig, ...tool }) => tool as Tool,
        );
      } catch (error) {
        console.error("Failed to get tools:", error);
        return [];
      }
    },
    [multiServerMCP],
  );

  // Compatibility method: callTool
  // This routes tool calls to the appropriate server
  const callTool = useCallback(
    async ({
      name,
      args,
      version,
    }: {
      name: string;
      args: Record<string, any>;
      version?: string;
    }) => {
      // Find which server has this tool
      const toolWithServer = allTools.find((tool) => tool.name === name);
      if (!toolWithServer) {
        throw new Error(`Tool '${name}' not found in any connected server`);
      }

      return multiServerMCP.callTool({
        serverName: toolWithServer.serverName,
        toolName: name,
        args,
        version,
      });
    },
    [allTools, multiServerMCP],
  );

  // Compatibility method: setTools
  // This is a no-op for multi-server as tools are managed per server
  const setTools = useCallback((tools: Tool[]) => {
    console.warn(
      "setTools is deprecated in multi-server MCP. Tools are managed per server.",
    );
  }, []);

  // Compatibility getter: tools
  // Returns all tools without server information for backward compatibility
  const tools: Tool[] = allTools.map(
    ({ serverName, serverConfig, ...tool }) => tool as Tool,
  );

  // Check if any server is loading
  const isAnyServerLoading = Array.from(multiServerMCP.loading.values()).some(
    (loading) => loading,
  );

  const contextValue: MultiServerMCPContextType = {
    // Multi-server specific
    ...multiServerMCP,
    allTools,
    isLoading: isLoading || isAnyServerLoading,

    // Compatibility layer
    getTools,
    callTool,
    setTools,
    tools,
    cursor,
  };

  return (
    <MultiServerMCPContext.Provider value={contextValue}>
      {children}
    </MultiServerMCPContext.Provider>
  );
};

export const useMultiServerMCPContext = () => {
  const context = useContext(MultiServerMCPContext);
  if (context === null) {
    throw new Error(
      "useMultiServerMCPContext must be used within a MultiServerMCPProvider",
    );
  }
  return context;
};

// Compatibility export: useMCPContext
// This allows existing code to work without changes
export const useMCPContext = () => {
  const context = useMultiServerMCPContext();

  // Return a subset that matches the original MCP context interface
  return {
    getTools: context.getTools,
    callTool: context.callTool,
    tools: context.tools,
    setTools: context.setTools,
    cursor: context.cursor,
    loading: context.isLoading,
    createAndConnectMCPClient: async () => {
      console.warn(
        "createAndConnectMCPClient is deprecated in multi-server MCP",
      );
      return null;
    },
  };
};
