# Multi-MCP Server Support Specification

## Executive Summary

This document outlines all changes necessary to support multiple MCP (Model Context Protocol) servers in the Open Agent Platform. Currently, the platform supports only a single MCP server configured via environment variables. The goal is to enable users to configure multiple MCP servers following the LangChain MCP adapters ClientConfig specification, allowing agents to access tools from any configured server.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target Architecture](#target-architecture)
3. [Required Changes](#required-changes)
4. [Implementation Phases](#implementation-phases)
5. [Security Considerations](#security-considerations)
6. [Backward Compatibility](#backward-compatibility)
7. [Testing Considerations](#testing-considerations)
8. [Documentation Updates](#documentation-updates)

## Current State Analysis

### Single MCP Server Implementation

The current implementation supports only ONE MCP server with the following limitations:

1. **Environment Variables**:
   - `NEXT_PUBLIC_MCP_SERVER_URL`: Single MCP server URL
   - `NEXT_PUBLIC_MCP_AUTH_REQUIRED`: Boolean flag for authentication requirement
   - `MCP_TOKENS`: JSON object containing access tokens

2. **Architecture**:
   - Frontend connects to MCP servers via `@modelcontextprotocol/sdk` client
   - API proxy at `/api/oap_mcp` handles authentication and request forwarding
   - Single MCP context provider manages all tools
   - Tools are fetched from one server only

3. **Tool Management**:
   - `useMCP` hook creates a single client connection
   - Tools stored in a flat array in MCP context
   - No server association for tools
   - Tool selection UI shows all tools from the single server

4. **Agent Configuration**:
   - `ConfigurableFieldMCPMetadata` stores tool configuration
   - Config includes: `tools[]`, `url`, `auth_required`
   - Migration scripts exist to update single MCP URL across agents

## Target Architecture

### LangChain MCP Adapters ClientConfig

Based on the [LangChain MCP adapters API reference](https://v03.api.js.langchain.com/types/_langchain_mcp_adapters.ClientConfig.html), the `mcpServers` object should follow this structure:

```typescript
mcpServers: Record<string, {
  // For stdio transport
  args: string[];
  command: string;
  cwd?: string;
  encoding?: string;
  env?: Record<string, string>;
  restart?: {
    delayMs?: number;
    enabled?: boolean;
    maxAttempts?: number;
  };
  stderr?: "overlapped" | "pipe" | "ignore" | "inherit";
  transport?: "stdio";
  type?: "stdio";
  defaultToolTimeout?: number;
  outputHandling?: "content" | "artifact" | OutputHandlingConfig;
} | {
  // For HTTP/SSE transport
  authProvider?: OAuthClientProvider;
  automaticSSEFallback?: boolean;
  headers?: Record<string, string>;
  reconnect?: {
    delayMs?: number;
    enabled?: boolean;
    maxAttempts?: number;
  };
  transport?: "http" | "sse";
  type?: "http" | "sse";
  url: string;
  defaultToolTimeout?: number;
  outputHandling?: "content" | "artifact" | OutputHandlingConfig;
}>;
```

## Required Changes

### 1. Environment Variable Structure

**Current**: Single server configuration
**New**: Multiple servers configuration

```bash
# Example environment variable
NEXT_PUBLIC_MCP_SERVERS='{
  "github": {
    "type": "http",
    "url": "https://mcp-github.example.com",
    "transport": "http",
    "authProvider": {
      "type": "oauth",
      "clientId": "github-client-id"
    }
  },
  "filesystem": {
    "type": "stdio",
    "command": "mcp-filesystem",
    "args": ["--root", "/workspace"],
    "transport": "stdio"
  },
  "slack": {
    "type": "http",
    "url": "https://mcp-slack.example.com",
    "transport": "sse",
    "headers": {
      "X-API-Key": "${SLACK_API_KEY}"
    }
  }
}'
```

### 2. Type Definitions

#### New Types Required (`/apps/web/src/types/mcp.ts`)

```typescript
// Common fields for all MCP server configurations
export interface MCPServerConfig {
  defaultToolTimeout?: number;
  outputHandling?: "content" | "artifact" | {
    audio?: "content" | "artifact";
    image?: "content" | "artifact";
    resource?: "content" | "artifact";
    text?: "content" | "artifact";
  };
}

// STDIO transport configuration
export interface MCPServerStdioConfig extends MCPServerConfig {
  type: "stdio";
  transport: "stdio";
  command: string;
  args: string[];
  cwd?: string;
  encoding?: string;
  env?: Record<string, string>;
  restart?: {
    delayMs?: number;
    enabled?: boolean;
    maxAttempts?: number;
  };
  stderr?: "overlapped" | "pipe" | "ignore" | "inherit";
}

// HTTP/SSE transport configuration
export interface MCPServerHTTPConfig extends MCPServerConfig {
  type: "http" | "sse";
  transport: "http" | "sse";
  url: string;
  authProvider?: OAuthClientProvider;
  automaticSSEFallback?: boolean;
  headers?: Record<string, string>;
  reconnect?: {
    delayMs?: number;
    enabled?: boolean;
    maxAttempts?: number;
  };
}

export type MCPServerConfiguration = MCPServerStdioConfig | MCPServerHTTPConfig;

export interface MCPServersConfig {
  [serverName: string]: MCPServerConfiguration;
}

// Update tool type to include server association
export interface ToolWithServer extends Tool {
  serverName: string;
  serverConfig: MCPServerConfiguration;
}
```

#### Update ConfigurableFieldMCPMetadata (`/apps/web/src/types/configurable.ts`)

```typescript
export type ConfigurableFieldMCPMetadata = {
  label: string;
  type: "mcp";
  default?: {
    // Change from single server to multiple servers
    servers?: {
      [serverName: string]: {
        tools?: string[];
        enabled?: boolean;
      };
    };
    // Deprecated fields for backward compatibility
    tools?: string[];
    url?: string;
    auth_required?: boolean;
  };
};
```

### 3. Frontend Changes

#### A. Environment Configuration (`/apps/web/src/lib/environment/mcp-servers.ts`)

```typescript
import { MCPServersConfig } from "@/types/mcp";

export function getMCPServers(): MCPServersConfig {
  const serversJson = process.env.NEXT_PUBLIC_MCP_SERVERS;
  
  if (!serversJson) {
    // Backward compatibility: check for single server config
    const singleServerUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
    if (singleServerUrl) {
      return {
        default: {
          type: "http",
          transport: "http",
          url: singleServerUrl,
          authProvider: process.env.NEXT_PUBLIC_MCP_AUTH_REQUIRED === "true"
            ? { type: "bearer" }
            : undefined,
        },
      };
    }
    return {};
  }
  
  try {
    return JSON.parse(serversJson);
  } catch (e) {
    console.error("Failed to parse MCP_SERVERS", e);
    return {};
  }
}
```

#### B. MCP Hook Refactor (`/apps/web/src/hooks/use-mcp.tsx`)

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { useState, useCallback } from "react";
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

export default function useMCP({
  name,
  version,
  serverName,
}: UseMCPOptions) {
  const [connections, setConnections] = useState<Map<string, MCPConnection>>(new Map());
  const [toolsByServer, setToolsByServer] = useState<Map<string, ToolWithServer[]>>(new Map());
  const [cursorsByServer, setCursorsByServer] = useState<Map<string, string>>(new Map());
  
  const createAndConnectMCPClient = async (
    serverName: string,
    serverConfig: MCPServerConfiguration
  ): Promise<Client> => {
    if (serverConfig.type === "stdio") {
      // Handle stdio transport (not supported in browser)
      throw new Error("STDIO transport not supported in browser environment");
    }
    
    // Handle HTTP/SSE transport
    const url = new URL(serverConfig.url);
    url.pathname = `${url.pathname}${url.pathname.endsWith("/") ? "" : "/"}mcp`;
    
    const transport = new StreamableHTTPClientTransport(url);
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
      setConnections(prev => new Map(prev).set(serverName, connection));
    }
    
    const tools = await connection.client.listTools({ cursor: nextCursor });
    
    if (tools.nextCursor) {
      setCursorsByServer(prev => new Map(prev).set(serverName, tools.nextCursor!));
    } else {
      setCursorsByServer(prev => {
        const next = new Map(prev);
        next.delete(serverName);
        return next;
      });
    }
    
    return tools.tools.map(tool => ({
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
        if (tools.some(t => t.name === name)) {
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
  
  return {
    getToolsFromServer,
    getAllTools,
    callTool,
    toolsByServer,
    setToolsByServer,
    cursorsByServer,
    connections,
  };
}
```

#### C. MCP Provider Update (`/apps/web/src/providers/MCP.tsx`)

```typescript
import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import useMCP from "../hooks/use-mcp";
import { getMCPServers } from "@/lib/environment/mcp-servers";
import { MCPServersConfig, ToolWithServer } from "@/types/mcp";

interface MCPContextType {
  servers: MCPServersConfig;
  toolsByServer: Map<string, ToolWithServer[]>;
  loading: boolean;
  loadingByServer: Map<string, boolean>;
  getToolsFromServer: (serverName: string, cursor?: string) => Promise<ToolWithServer[]>;
  getAllTools: () => Promise<ToolWithServer[]>;
  callTool: (params: any) => Promise<any>;
  cursorsByServer: Map<string, string>;
}

const MCPContext = createContext<MCPContextType | null>(null);

export const MCPProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const mcpState = useMCP({
    name: "Open Agent Platform",
    version: "1.0.0",
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingByServer, setLoadingByServer] = useState<Map<string, boolean>>(new Map());
  const servers = getMCPServers();
  
  useEffect(() => {
    // Initial load of tools from all servers
    setLoading(true);
    mcpState.getAllTools()
      .then(tools => {
        const toolsMap = new Map<string, ToolWithServer[]>();
        tools.forEach(tool => {
          const serverTools = toolsMap.get(tool.serverName) || [];
          serverTools.push(tool);
          toolsMap.set(tool.serverName, serverTools);
        });
        mcpState.setToolsByServer(toolsMap);
      })
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <MCPContext.Provider value={{
      servers,
      toolsByServer: mcpState.toolsByServer,
      loading,
      loadingByServer,
      getToolsFromServer: mcpState.getToolsFromServer,
      getAllTools: mcpState.getAllTools,
      callTool: mcpState.callTool,
      cursorsByServer: mcpState.cursorsByServer,
    }}>
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
```

#### D. Tools Playground Updates (`/apps/web/src/features/tools/playground/index.tsx`)

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ToolsPlaygroundInterface() {
  const { servers, toolsByServer, loading, callTool } = useMCPContext();
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<ToolWithServer>();
  
  // Server selection dropdown
  const ServerSelector = () => (
    <div className="flex items-center gap-4">
      <Label>Select Server:</Label>
      <Select value={selectedServer} onValueChange={setSelectedServer}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a server" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(servers).map(serverName => (
            <SelectItem key={serverName} value={serverName}>
              {serverName}
              <Badge variant="outline" className="ml-2">
                {toolsByServer.get(serverName)?.length || 0} tools
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Display tools for selected server
  const serverTools = selectedServer ? toolsByServer.get(selectedServer) || [] : [];
  
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="size-6" />
          <p className="text-lg font-semibold">Tools Playground</p>
        </div>
        <ServerSelector />
      </div>
      
      <Separator />
      
      {selectedServer && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serverTools.map(tool => (
            <ToolCard 
              key={`${tool.serverName}-${tool.name}`} 
              tool={tool}
              onClick={() => setSelectedTool(tool)}
            />
          ))}
        </div>
      )}
      
      {!selectedServer && (
        <div className="text-center text-muted-foreground py-8">
          Please select a server to view its tools
        </div>
      )}
    </div>
  );
}
```

#### E. Agent Creation Dialog Updates (`/apps/web/src/features/agents/components/create-edit-agent-dialogs/agent-form.tsx`)

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight } from "lucide-react";

// Tool selection should group by server
const ToolSelectionByServer = ({ toolConfigLabel }: { toolConfigLabel: string }) => {
  const { servers, toolsByServer } = useMCPContext();
  const form = useFormContext();
  
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold tracking-tight">Agent Tools</p>
      <Search
        onSearchChange={debouncedSetSearchTerm}
        placeholder="Search tools across all servers..."
        className="w-full"
      />
      
      <div className="relative w-full flex-1 basis-[500px] rounded-md border-[1px] border-slate-200 px-4">
        <div className="absolute inset-0 overflow-y-auto px-4">
          {Object.entries(servers).map(([serverName, serverConfig]) => {
            const tools = toolsByServer.get(serverName) || [];
            const selectedTools = form.watch(`config.${toolConfigLabel}.servers.${serverName}.tools`) || [];
            
            return (
              <Collapsible key={serverName} className="border-b py-4">
                <CollapsibleTrigger className="flex items-center gap-2 w-full hover:bg-muted/50 p-2 rounded">
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-medium">{serverName}</span>
                  <Badge variant="outline">{tools.length} tools</Badge>
                  {selectedTools.length > 0 && (
                    <Badge>{selectedTools.length} selected</Badge>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-6 space-y-2 mt-2">
                    {tools.map(tool => (
                      <Controller
                        key={`${serverName}-${tool.name}`}
                        control={form.control}
                        name={`config.${toolConfigLabel}.servers.${serverName}.tools`}
                        render={({ field }) => {
                          const isSelected = field.value?.includes(tool.name);
                          return (
                            <div className="flex items-start space-x-2 py-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, tool.name]);
                                  } else {
                                    field.onChange(current.filter(t => t !== tool.name));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <Label className="font-normal">{tool.name}</Label>
                                <p className="text-sm text-muted-foreground">
                                  {tool.description}
                                </p>
                              </div>
                            </div>
                          );
                        }}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

#### F. Chat Configuration Sidebar

Similar updates to the agent creation dialog, allowing users to select tools grouped by server in the chat configuration sidebar at `/apps/web/src/features/chat/components/configuration-sidebar/index.tsx`.

### 4. Backend Changes

#### A. API Proxy Route Structure

Create a new dynamic route to handle multiple servers:

```typescript
// /apps/web/src/app/api/oap_mcp/[server]/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMCPServers } from "@/lib/environment/mcp-servers";
import { handleServerAuth } from "@/lib/mcp-auth";

export async function proxyRequest(
  req: NextRequest,
  { params }: { params: { server: string; path: string[] } }
): Promise<Response> {
  const servers = getMCPServers();
  const serverConfig = servers[params.server];
  
  if (!serverConfig) {
    return NextResponse.json(
      { message: `Server ${params.server} not found` },
      { status: 404 }
    );
  }
  
  if (serverConfig.type === "stdio") {
    return NextResponse.json(
      { message: "STDIO transport not supported via proxy" },
      { status: 400 }
    );
  }
  
  // Construct target URL
  const path = params.path.join("/");
  const targetUrl = new URL(serverConfig.url);
  targetUrl.pathname = `${targetUrl.pathname}/mcp/${path}`;
  
  // Handle authentication based on server config
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.append(key, value);
    }
  });
  
  // Apply server-specific auth
  if (serverConfig.authProvider) {
    const accessToken = await handleServerAuth(serverConfig, req);
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }
  
  // Apply custom headers
  if (serverConfig.headers) {
    Object.entries(serverConfig.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  // Make the proxied request
  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers,
    body: req.body,
  });
  
  // Return the response
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// Export handlers for all HTTP methods
export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
```

#### B. Authentication Handling (`/apps/web/src/lib/mcp-auth.ts`)

```typescript
import { MCPServerHTTPConfig } from "@/types/mcp";
import { NextRequest } from "next/server";

interface ServerAuthState {
  serverName: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export async function handleServerAuth(
  serverConfig: MCPServerHTTPConfig,
  req: NextRequest
): Promise<string | null> {
  if (!serverConfig.authProvider) {
    return null;
  }
  
  const { authProvider } = serverConfig;
  
  switch (authProvider.type) {
    case "oauth":
      return handleOAuthFlow(serverConfig, authProvider, req);
    case "bearer":
      return handleBearerToken(serverConfig, req);
    case "api-key":
      return authProvider.apiKey;
    default:
      console.warn(`Unknown auth provider type: ${authProvider.type}`);
      return null;
  }
}

async function handleOAuthFlow(
  serverConfig: MCPServerHTTPConfig,
  authProvider: OAuthClientProvider,
  req: NextRequest
): Promise<string | null> {
  // Check for existing valid token
  const existingToken = await getStoredToken(serverConfig.url);
  if (existingToken && !isTokenExpired(existingToken)) {
    return existingToken.accessToken;
  }
  
  // Implement OAuth 2.0 flow as per MCP spec
  // This would involve:
  // 1. Discovery of authorization server
  // 2. Dynamic client registration if needed
  // 3. Authorization code flow with PKCE
  // 4. Token exchange
  // 5. Token storage
  
  // For now, return null as placeholder
  return null;
}

async function handleBearerToken(
  serverConfig: MCPServerHTTPConfig,
  req: NextRequest
): Promise<string | null> {
  // Check for bearer token in various sources
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const tokenCookie = req.cookies.get("X-MCP-Access-Token");
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  // Check environment variables
  const envTokens = process.env.MCP_TOKENS;
  if (envTokens) {
    try {
      const tokens = JSON.parse(envTokens);
      return tokens[serverConfig.url] || null;
    } catch (e) {
      console.error("Failed to parse MCP_TOKENS", e);
    }
  }
  
  return null;
}
```

### 5. Migration Scripts

#### A. Environment Variable Migration (`/apps/web/scripts/migrate-single-to-multi-mcp.ts`)

```typescript
import "dotenv/config";
import { MCPServersConfig } from "@/types/mcp";

async function migrateSingleToMultiMCP() {
  const singleServerUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
  const authRequired = process.env.NEXT_PUBLIC_MCP_AUTH_REQUIRED === "true";
  
  if (!singleServerUrl) {
    console.log("No single server configuration found");
    return;
  }
  
  const multiServerConfig: MCPServersConfig = {
    default: {
      type: "http",
      transport: "http",
      url: singleServerUrl,
      authProvider: authRequired ? { type: "bearer" } : undefined,
    },
  };
  
  console.log("Migration config:");
  console.log(JSON.stringify(multiServerConfig, null, 2));
  console.log("");
  console.log("Add this to your environment:");
  console.log(`NEXT_PUBLIC_MCP_SERVERS='${JSON.stringify(multiServerConfig)}'`);
  console.log("");
  console.log("You can then remove the old environment variables:");
  console.log("- NEXT_PUBLIC_MCP_SERVER_URL");
  console.log("- NEXT_PUBLIC_MCP_AUTH_REQUIRED");
}

migrateSingleToMultiMCP().catch(console.error);
```

#### B. Agent Configuration Migration (`/apps/web/scripts/migrate-agent-mcp-configs.ts`)

```typescript
import "dotenv/config";
import { getDeployments } from "@/lib/environment/deployments";
import { createClient } from "@/lib/client";
import { extractConfigurationsFromAgent } from "@/lib/ui-config";

async function migrateAgentMCPConfigs() {
  const deployments = getDeployments();
  
  for (const deployment of deployments) {
    const client = createClient(deployment.id, process.env.LANGSMITH_API_KEY!);
    const agents = await client.assistants.search({ limit: 100 });
    
    for (const agent of agents) {
      const schema = await client.assistants.getSchemas(agent.assistant_id);
      const configs = extractConfigurationsFromAgent({ 
        agent, 
        schema: schema.config_schema 
      });
      
      if (!configs.toolConfig?.[0]) continue;
      
      const oldConfig = configs.toolConfig[0].default;
      if (!oldConfig?.tools || !oldConfig?.url) continue;
      
      // Convert old format to new format
      const newConfig = {
        servers: {
          default: {
            tools: oldConfig.tools,
            enabled: true,
          },
        },
      };
      
      await client.assistants.update(agent.assistant_id, {
        config: {
          configurable: {
            ...configs.configFields,
            [configs.toolConfig[0].label]: newConfig,
          },
        },
      });
      
      console.log(`Migrated agent ${agent.name} (${agent.assistant_id})`);
    }
  }
}

migrateAgentMCPConfigs().catch(console.error);
```

### 6. UI/UX Considerations

#### A. Server Status Indicators
- Show connection status for each server (connected, connecting, error)
- Display authentication status (authenticated, requires auth, auth failed)
- Show error states with retry options

#### B. Tool Search
- Global search across all servers
- Filter by server using checkboxes or dropdown
- Show server badge on each tool card
- Highlight which server a tool belongs to

#### C. Performance
- Lazy load tools from servers
- Cache tool lists with TTL
- Parallel server connections on initial load
- Implement connection pooling for HTTP transports

#### D. Error States
- Clear error messages for connection failures
- Retry buttons for failed connections
- Fallback to cached data when available
- Show partial results if some servers fail

### 7. Error Handling

#### A. Connection Failures

```typescript
interface ServerError {
  serverName: string;
  error: Error;
  retryable: boolean;
  lastAttempt: Date;
}

// In MCP Provider
const [serverErrors, setServerErrors] = useState<Map<string, ServerError>>(new Map());

const handleServerError = (serverName: string, error: Error) => {
  setServerErrors(prev => new Map(prev).set(serverName, {
    serverName,
    error,
    retryable: isRetryableError(error),
    lastAttempt: new Date(),
  }));
};

const retryServerConnection = async (serverName: string) => {
  setServerErrors(prev => {
    const next = new Map(prev);
    next.delete(serverName);
    return next;
  });
  
  try {
    await getToolsFromServer(serverName);
  } catch (e) {
    handleServerError(serverName, e as Error);
  }
};
```

#### B. Authentication Failures
- Clear indication of which servers require authentication
- Guide users through auth flow for each server
- Store auth state per server
- Handle token refresh automatically

### 8. Testing Considerations

#### A. Unit Tests
- Test multi-server configuration parsing
- Test tool grouping by server
- Test authentication flows for different auth types
- Test error handling and retry logic

#### B. Integration Tests
- Test connecting to multiple mock servers
- Test tool discovery from multiple sources
- Test failover scenarios
- Test authentication with different providers

#### C. E2E Tests
- Test complete user flow with multiple servers
- Test agent creation with tools from different servers
- Test chat with multi-server tools
- Test error recovery flows

### 9. Documentation Updates

#### A. Environment Variable Documentation
```markdown
## Configuring Multiple MCP Servers

The Open Agent Platform supports connecting to multiple MCP servers. Configure them using the `NEXT_PUBLIC_MCP_SERVERS` environment variable:

### Basic Example
```bash
NEXT_PUBLIC_MCP_SERVERS='{
  "github": {
    "type": "http",
    "url": "https://mcp-github.example.com",
    "transport": "http"
  },
  "slack": {
    "type": "http",
    "url": "https://mcp-slack.example.com",
    "transport": "sse",
    "headers": {
      "X-API-Key": "your-api-key"
    }
  }
}'
```

### With Authentication
```bash
NEXT_PUBLIC_MCP_SERVERS='{
  "private-server": {
    "type": "http",
    "url": "https://private-mcp.example.com",
    "transport": "http",
    "authProvider": {
      "type": "oauth",
      "clientId": "your-client-id",
      "authorizationUrl": "https://auth.example.com/authorize",
      "tokenUrl": "https://auth.example.com/token"
    }
  }
}'
```
```

#### B. Migration Guide
- Step-by-step guide for migrating from single to multi-server setup
- Script usage instructions
- Troubleshooting common issues

### 10. Backward Compatibility

#### A. Environment Variables
- Continue supporting `NEXT_PUBLIC_MCP_SERVER_URL` and `NEXT_PUBLIC_MCP_AUTH_REQUIRED`
- Auto-convert to multi-server format internally
- Show deprecation warnings in console

#### B. Agent Configurations
- Support old tool config format (`tools`, `url`, `auth_required`)
- Auto-migrate on agent update
- Preserve existing functionality

#### C. API Routes
- Keep `/api/oap_mcp` route for backward compatibility
- Redirect to new multi-server routes internally

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. Create new type definitions
2. Implement environment configuration parser
3. Update MCP hook for multi-server support
4. Update MCP provider

### Phase 2: UI Updates (Week 2)
1. Update tools playground with server selection
2. Update agent creation dialog with grouped tools
3. Update chat configuration sidebar
4. Add server status indicators

### Phase 3: Authentication (Week 3)
1. Implement OAuth 2.0 flow
2. Add per-server auth state management
3. Implement token refresh logic
4. Add auth UI components

### Phase 4: Migration & Testing (Week 4)
1. Create migration scripts
2. Write comprehensive tests
3. Update documentation
4. Performance optimization

### Phase 5: Polish & Release (Week 5)
1. Error handling improvements
2. UI/UX refinements
3. Final testing
4. Release preparation

## Security Considerations

### 1. Token Storage
- Store tokens securely using encrypted cookies or secure storage
- Implement token rotation for refresh tokens
- Clear tokens on logout
- Use separate token storage per server

### 2. Server Validation
- Validate server URLs to prevent SSRF attacks
- Sanitize server configurations
- Implement allowlist for server domains
- Validate SSL certificates

### 3. Authentication
- Follow OAuth 2.0 security best practices
- Implement PKCE for all OAuth flows
- Validate redirect URIs
- Use state parameter to prevent CSRF
- Implement proper token audience validation

### 4. API Security
- Validate all proxy requests
- Implement rate limiting per server
- Log security events
- Monitor for suspicious activity

## Performance Considerations

### 1. Connection Management
- Implement connection pooling
- Reuse HTTP connections
- Set appropriate timeouts
- Handle connection failures gracefully

### 2. Caching
- Cache tool lists with appropriate TTL
- Implement cache invalidation
- Use stale-while-revalidate pattern
- Cache authentication tokens

### 3. Parallel Operations
- Connect to servers in parallel
- Load tools asynchronously
- Implement request batching where possible
- Use web workers for heavy operations

## Monitoring & Observability

### 1. Metrics
- Track connection success/failure rates per server
- Monitor tool discovery performance
- Track authentication success rates
- Monitor API response times

### 2. Logging
- Log all server connections
- Log authentication events
- Log errors with context
- Implement structured logging

### 3. Alerts
- Alert on server connection failures
- Alert on authentication failures
- Alert on performance degradation
- Alert on security events

## Conclusion

This specification provides a comprehensive plan for implementing multi-MCP server support in the Open Agent Platform. The implementation maintains backward compatibility while enabling users to connect to multiple MCP servers with different transport types and authentication requirements. The phased approach ensures that core functionality is delivered first, with authentication and migration support following.

Key benefits of this implementation:
- Support for unlimited MCP servers
- Per-server authentication
- Grouped tool selection
- Backward compatibility
- Enhanced error handling
- Improved performance

The implementation follows the LangChain MCP adapters specification, ensuring compatibility with the broader ecosystem while providing a superior user experience for managing multiple MCP servers.
