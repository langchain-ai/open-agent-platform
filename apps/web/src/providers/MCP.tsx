import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useEffect,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import useMCP from "../hooks/use-mcp";
import { getMCPServers } from "@/lib/environment/mcp-servers";
import { MCPServersConfig, ToolWithServer } from "@/types/mcp";

interface MCPContextType {
  servers: MCPServersConfig;
  toolsByServer: Map<string, ToolWithServer[]>;
  loading: boolean;
  loadingByServer: Map<string, boolean>;
  getToolsFromServer: (
    serverName: string,
    cursor?: string,
  ) => Promise<ToolWithServer[]>;
  getAllTools: () => Promise<ToolWithServer[]>;
  callTool: (params: any) => Promise<any>;
  cursorsByServer: Map<string, string>;
  // Legacy compatibility
  tools: ToolWithServer[];
  setTools: Dispatch<SetStateAction<ToolWithServer[]>>;
  cursor: string;
  getTools: () => Promise<ToolWithServer[]>;
  getToolsByServer: (serverName: string, cursor?: string) => Promise<ToolWithServer[]>;
  createAndConnectMCPClient: () => Promise<any>;
}

const MCPContext = createContext<MCPContextType | null>(null);

export const MCPProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const mcpState = useMCP({
    name: "Open Agent Platform",
    version: "1.0.0",
  });

  const [loading, setLoading] = useState(false);
  const [loadingByServer] = useState<Map<string, boolean>>(new Map());
  const servers = getMCPServers();

  useEffect(() => {
    // Initial load of tools from all servers
    setLoading(true);
    mcpState
      .getAllTools()
      .then((tools) => {
        const toolsMap = new Map<string, ToolWithServer[]>();
        tools.forEach((tool) => {
          const serverTools = toolsMap.get(tool.serverName) || [];
          serverTools.push(tool);
          toolsMap.set(tool.serverName, serverTools);
        });
        mcpState.setToolsByServer(toolsMap);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <MCPContext.Provider
      value={{
        servers,
        toolsByServer: mcpState.toolsByServer,
        loading,
        loadingByServer,
        getToolsFromServer: mcpState.getToolsFromServer,
        getAllTools: mcpState.getAllTools,
        callTool: mcpState.callTool,
        cursorsByServer: mcpState.cursorsByServer,
        // Legacy compatibility
        tools: mcpState.tools,
        setTools: mcpState.setTools,
        cursor: mcpState.cursor,
        getTools: mcpState.getTools,
        getToolsByServer: mcpState.getToolsByServer,
        createAndConnectMCPClient: mcpState.createAndConnectMCPClient,
      }}
    >
      {children}
    </MCPContext.Provider>
  );
};

export const useMCPContext = () => {
  const context = useContext(MCPContext);
  if (context === null) {
    throw new Error("useMCPContext must be used within a MCPProvider");
  }
  return context;
};
