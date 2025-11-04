# OAP Tool Management System - Comprehensive Discovery Report

**Scope:** `apps/web/src/features/tools/`, `apps/web/src/hooks/use-mcp.tsx`, `apps/web/src/types/tool.ts`

**Date:** 2025-10-24

**Thoroughness Level:** Very Thorough

---

## Executive Summary

The OAP Tool Management System is a sophisticated Model Context Protocol (MCP) integration layer that enables agents to discover, configure, and execute external tools. The system features a dual interface: an explorer view for browsing available tools and a playground for testing tool execution. Tools are organized through an MCP server connection with caching mechanisms, pagination support, and agent prompt recommendations.

---

## Part 1: Domain Map

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Tools Page   │  │ Playground   │  │ Agent Config │      │
│  │ (Explorer)   │  │ (Tester)     │  │ (Selector)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Hook Layer (State Management)             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ useMCP (Tool Discovery & Execution)                 │   │
│  │  - Client Connection Management (Cached)            │   │
│  │  - Tool Listing with Pagination                     │   │
│  │  - Tool Execution/Calling                           │   │
│  │  - Session Persistence                              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ useSearchTools (Tool Search & Filtering)            │   │
│  │  - Debounced Search                                 │   │
│  │  - Pre-selected Tool Prioritization                 │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                 Provider Layer (Context)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐      │
│  │ MCPProvider (MCPContext)                          │      │
│  │  - Wraps useMCP hook                              │      │
│  │  - Initializes tool loading on mount              │      │
│  │  - Provides tools to all descendants              │      │
│  └──────────────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                   Type System (TypeScript)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │ Tool         │  │ InputSchema    │  │ ToolMetadata │   │
│  │              │  │                │  │              │   │
│  │ name         │  │ type (object)  │  │ mcp_server   │   │
│  │ description  │  │ properties     │  │ agent_prompts│   │
│  │ inputSchema  │  │ required[]     │  │              │   │
│  │ metadata     │  │                │  │              │   │
│  └──────────────┘  └────────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────────┤
│              Communication Layer (MCP SDK)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐       │
│  │ StreamableHTTPClientTransport                   │       │
│  │  - HTTP connection to MCP server                │       │
│  │  - Endpoint: {NEXT_PUBLIC_BASE_API_URL}/oap_mcp│       │
│  │  - Session ID header for session persistence   │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
MCPProvider
├─ ToolsInterface (Main Tools Explorer)
│  ├─ Search Component
│  ├─ ToolCard[] (Grid)
│  │  ├─ ToolDetailsDialog
│  │  │  ├─ SchemaRenderer (Input schema viewer)
│  │  │  └─ ToolMetadataView (Agent modes/practices)
│  │  └─ Link to Playground
│  └─ Load More Button (Pagination)
│
└─ ToolsPlaygroundInterface (Tool Tester)
   ├─ ToolListCommand (Tool selector dropdown)
   ├─ SchemaForm (Input builder)
   └─ ResponseViewer (Output display)
```

---

## Part 2: Question Answers

### 1. What are "tools" in OAP?

Tools in OAP are **external capabilities exposed via the Model Context Protocol (MCP)** that agents can discover and execute. A tool represents:

- **A callable function** with defined inputs (JSON schema) and outputs
- **A capability** an agent can use to accomplish tasks (e.g., search APIs, file operations, external services)
- **Metadata-rich descriptions** including:
  - Name and description
  - Input schema (what parameters it expects)
  - MCP server location (which server hosts it)
  - Agent prompt recommendations (how agents should use it)
  - Best practices and common pitfalls

#### Tool Structure (TypeScript)

```typescript
// From apps/web/src/types/tool.ts
export interface Tool {
  // The name of the tool
  name: string;
  // The tool's description
  description?: string;
  // The tool's input schema (JSON Schema format)
  inputSchema: InputSchema;
  // Optional metadata including agent prompt recommendations
  metadata?: ToolMetadata;
}

export type InputSchema = {
  type: "object";
  properties?: Record<string, any>;
  required?: string[];
};

export interface ToolMetadata {
  // Name of the MCP server providing this tool
  mcp_server?: string;
  // Original tool name before prefixing
  original_name?: string;
  // Categories of operations this tool provides
  tool_categories?: string[];
  // Agent prompt recommendations
  agent_prompts?: AgentPromptsMetadata;
}
```

#### Example Use Cases

- **Web Search Tool**: Search the internet, returns results
- **File Tool**: Read/write files from a workspace
- **API Integration Tool**: Call REST APIs with authentication
- **Database Tool**: Query or update databases
- **Custom Business Logic**: Organization-specific operations

---

### 2. How are tools registered/discovered?

#### Discovery Mechanism

Tools are discovered through a **Model Context Protocol (MCP) server**:

1. **Server Registration**: An MCP server exposes tools via a standard interface
2. **Connection**: The web app connects to the MCP server at runtime via HTTP
3. **Listing**: The `listTools()` MCP method returns available tools
4. **Pagination**: Large tool sets are paginated via cursor-based navigation

#### Discovery Process Flow

```
┌─────────────────────────────────────────────────────────┐
│  MCPProvider (on mount)                                 │
│  - Initializes useMCP hook                              │
│  - Calls getTools() on component mount                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  useMCP Hook                                            │
│  - Creates StreamableHTTPClientTransport                │
│  - Connects to MCP server via HTTP                      │
│  - Maintains cached Client (session persistence)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  MCP Server (Backend)                                   │
│  - Endpoint: {NEXT_PUBLIC_BASE_API_URL}/oap_mcp        │
│  - Returns: { tools: Tool[], nextCursor?: string }     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  useMCP Hook (getTools returns)                         │
│  - Stores tools in React state (setTools)              │
│  - Updates pagination cursor if present                 │
└─────────────────────────────────────────────────────────┘
```

#### Discovery Code Example

From `apps/web/src/hooks/use-mcp.tsx`:

```typescript
// Get or create MCP client (cached for session stability)
const getOrCreateClient = async (): Promise<Client> => {
  // Return cached client if available
  if (mcpClientRef.current) {
    return mcpClientRef.current;
  }

  // Create new client and cache it
  const url = getMCPUrlOrThrow();
  const connectionClient = new StreamableHTTPClientTransport(new URL(url));
  const mcp = new Client({ name, version });
  
  await mcp.connect(connectionClient);
  
  // Cache for future calls
  mcpClientRef.current = mcp;
  
  return mcp;
};

// List available tools
const getTools = async (nextCursor?: string): Promise<Tool[]> => {
  const mcp = await getOrCreateClient();
  const tools = await mcp.listTools({ cursor: nextCursor });
  
  if (tools.nextCursor) {
    setCursor(tools.nextCursor);
  } else {
    setCursor("");
  }
  
  return tools.tools;
};
```

#### Pagination Support

- **Cursor-based pagination**: Tools are returned in batches
- **Load More button**: Users can request next batch on demand
- **Session persistence**: Cursor stored in component state for continuous pagination

---

### 3. Where are tool configurations stored?

Tool configurations are stored in **multiple layers**:

#### Layer 1: MCP Server (Backend)

- **Location**: Backend MCP server (typical endpoint: `/oap_mcp`)
- **Responsibility**: Hosts tool metadata, schemas, and implementations
- **Persistence**: Database or configuration files (implementation-dependent)

#### Layer 2: Client State (React)

```typescript
// In MCPProvider and useMCP hook
const [tools, setTools] = useState<Tool[]>([]); // All available tools
const [cursor, setCursor] = useState("");        // Pagination cursor
```

#### Layer 3: Zustand Store (Agent Configuration)

From configuration sidebar (`use-config-store`):

```typescript
// Stores selected tools per agent
configsByAgentId[agentId]['selected-tools'][toolId] = {
  tools: ['tool1', 'tool2', ...]  // Array of selected tool names
}
```

#### Layer 4: Agent Deployment (Persistent)

- **Location**: LangGraph backend
- **Structure**: Stored within agent configuration
- **Update Flow**: 
  1. User selects tools in UI
  2. Configuration is saved via `updateAgent()` API
  3. Backend stores in agent's deployment record

#### Configuration Storage Flow

```
┌─────────────────┐
│  Tool Selection │  (Checkboxes in Config Sidebar)
│  in UI          │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Zustand Store       │  (Temporary React state)
│  (use-config-store)  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Agent Update API    │  (Save to backend)
│  updateAgent()       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  LangGraph Backend   │  (Persistent storage)
│  Agent Deployment    │
└──────────────────────┘
```

#### Configuration Types

1. **Tool Selection**: Which tools are available to an agent
2. **Tool Parameters**: Default values and constraints for tool inputs
3. **Tool Metadata**: Descriptions, categories, best practices
4. **Agent Prompts**: Recommendations for how agents should use tools

---

### 4. How do tools integrate with agents?

#### Integration Flow

```
Agent Execution
    ▼
Agent needs to accomplish a task
    ▼
Agent's system prompt includes tool descriptions
    ▼
Agent decides which tool to call
    ▼
Tool call routed to MCP server
    ▼
MCP executes tool
    ▼
Result returned to agent
    ▼
Agent continues with response
```

#### Integration Architecture

**In Agent Creation/Configuration:**

```typescript
// File: apps/web/src/features/agents/components/create-edit-agent-dialogs/agent-form.tsx

// Get available tools from MCP
const { tools, setTools, getTools, cursor, loading } = useMCPContext();

// Search and filter tools
const { displayTools } = useSearchTools(tools, {
  preSelectedTools: toolConfigurations[0]?.default?.tools,
});

// Display tool selection UI
// User checks/unchecks tools to enable/disable them for this agent
<ConfigFieldTool
  id={toolId}
  label={toolName}
  description={toolDescription}
  agentId={agentId}
  value={selectedTools}
  setValue={setSelectedTools}
/>
```

**At Agent Deployment:**

1. Agent configuration includes selected tools array
2. LangGraph backend receives tool names
3. Backend configures agent with tool bindings
4. Agent's system prompt includes tool descriptions

**During Agent Execution:**

1. Agent calls tool via MCP with tool name and parameters
2. `callTool()` in useMCP hook executes the call
3. Result returned to agent
4. Agent processes result and continues

#### Tool Selection UI (Configuration Sidebar)

From `apps/web/src/features/chat/components/configuration-sidebar/config-field.tsx`:

```typescript
export function ConfigFieldTool({
  id,           // Tool ID
  label,        // Tool name
  description,  // Tool description
  agentId,      // Which agent
  value,        // Currently selected tools
  setValue,     // Callback to update selection
}: Props) {
  // Check if this tool is currently selected
  const checked = defaults.tools?.some((t) => t === label);

  const handleCheckedChange = (checked: boolean) => {
    const newValue = checked
      ? {
          ...defaults,
          // Add to selected tools (remove duplicates)
          tools: Array.from(
            new Set<string>([...(defaults.tools || []), label]),
          ),
        }
      : {
          ...defaults,
          // Remove from selected tools
          tools: defaults.tools?.filter((t) => t !== label),
        };

    // Update Zustand store (triggers UI update)
    store.updateConfig(actualAgentId, toolId, newValue);
  };

  return (
    <div className="space-y-2">
      <Label>{_.startCase(label)}</Label>
      <Switch
        checked={checked}
        onCheckedChange={handleCheckedChange}
      />
    </div>
  );
}
```

#### Tool Execution During Conversation

From `apps/web/src/features/tools/playground/index.tsx`:

```typescript
const handleSubmit = async () => {
  if (!selectedTool) return;
  
  setIsLoading(true);
  
  try {
    // Call tool with user-provided arguments
    const toolRes = await callTool({
      name: selectedTool.name,
      args: inputValues,
    });
    
    setResponse(toolRes);
  } catch (e: any) {
    // Handle authentication required (OAuth flow)
    if (e.code === -32003 && e.data) {
      setAuthRequiredMessage(
        <div>
          <p>{e.data?.message?.text}</p>
          <a href={e.data?.url}>Authenticate here</a>
        </div>,
      );
    }
  }
  
  setIsLoading(false);
};
```

---

### 5. What UI exists for tool management?

The tool management UI consists of two main interfaces:

#### Interface 1: Tools Explorer (`/tools`)

**Purpose**: Browse and view all available tools

**Components**:
- **Header**: Wrench icon + "Tools" title with total count badge
- **Search Bar**: Full-width search input with debouncing
- **Tool Grid**: 3-column responsive grid on desktop, 1-column on mobile
  - Each card shows: name, description, badge with agent modes count
  - Buttons: "Playground" (link to tester), "View Details" (eye icon)
- **Load More**: Pagination button for large tool sets

**File**: `apps/web/src/features/tools/index.tsx`

```typescript
export default function ToolsInterface(): React.ReactNode {
  return (
    <div className="flex w-full flex-col gap-4 p-6">
      {/* Header with icon and search */}
      <div className="flex w-full items-center justify-start gap-6">
        <div className="flex items-center justify-start gap-2">
          <Wrench className="size-6" />
          <p className="flex items-center gap-2 text-lg font-semibold">
            Tools
            <TotalToolsBadge
              toolsCount={tools.length}
              loading={loading}
              hasMore={!!cursor}
            />
          </p>
        </div>
        <Search
          onSearchChange={debouncedSetSearchTerm}
          placeholder="Search tools..."
          className="w-full"
        />
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool, index) => (
          <ToolCard key={`${tool.name}-${index}`} tool={tool} />
        ))}
      </div>

      {/* Load more button */}
      {cursor && (
        <Button
          onClick={handleLoadMore}
          disabled={loadingMore}
          variant="outline"
        >
          {loadingMore ? "Loading..." : "Load More Tools"}
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

#### Interface 2: Tools Playground (`/tools/playground`)

**Purpose**: Test tools before using them in agents

**Layout**: Resizable two-column split pane

**Left Panel: Input Form**
- Tool selector dropdown (combobox)
- Dynamic form based on tool's input schema
- Field types supported:
  - Text input
  - Number input with sliders (if min/max defined)
  - Dropdown (enum values)
  - Boolean toggles
  - Multiline text
- "Run Tool" button

**Right Panel: Response Viewer**
- Two view modes: "Pretty" (formatted) and "Raw" (JSON)
- Loading spinner during execution
- Error display with alert styling
- Authentication required UI (with OAuth link if needed)

**Files**: 
- `apps/web/src/features/tools/playground/index.tsx`
- `apps/web/src/features/tools/playground/components/schema-form.tsx`
- `apps/web/src/features/tools/playground/components/response-viewer.tsx`

```typescript
// Playground structure
export default function ToolsPlaygroundInterface() {
  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* Header and tool selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tools Playground</h1>
        <ToolListCommand
          value={selectedTool}
          setValue={setSelectedTool}
        />
      </div>

      {/* Tool description */}
      <div className="border-b py-6">
        <h2 className="text-lg font-medium">
          {_.startCase(selectedTool.name)}
        </h2>
        <p className="text-sm text-gray-500">
          {selectedTool.description}
        </p>
        <Button onClick={handleSubmit} disabled={isLoading}>
          Run Tool
        </Button>
      </div>

      {/* Split pane: Input | Response */}
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>
          <SchemaForm
            schema={selectedTool.inputSchema}
            onChange={handleInputChange}
            values={inputValues}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <ResponseViewer
            response={response}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

#### Interface 3: Tool Details Dialog

**Purpose**: View comprehensive tool metadata

**Content**:
- Tabs: "Schema" | "Agent Modes"
- **Schema Tab**: Expands tool input schema with types and descriptions
- **Agent Modes Tab**: Shows available prompt templates for this tool
  - Agent Modes cards (preview first 4, collapsible)
  - Best Practices section (collapsible, green background)
  - Common Pitfalls section (collapsible, yellow background)
  - Configuration Requirements section (collapsible, blue background)

**File**: `apps/web/src/features/tools/components/tool-details-dialog/index.tsx`

#### Interface 4: Tool Selection in Agent Configuration

**Purpose**: Enable/disable tools for specific agents

**Location**: Configuration Sidebar (right panel in chat)
**UI Pattern**: Toggle switches for each available tool
**Features**:
- Pre-selected tools shown first
- Searchable/filterable list
- Load more pagination support
- Zustand store integration for state management

**File**: `apps/web/src/features/chat/components/configuration-sidebar/config-field.tsx`

---

### 6. What is MCP and how does it relate to tools?

#### What is MCP (Model Context Protocol)?

**MCP** is an open standard by Anthropic for enabling AI models to interact with external tools and data sources via a standardized protocol.

**Key Characteristics**:
- **Client-Server Architecture**: Clients (AI apps) connect to MCP servers
- **HTTP-based**: Uses StreamableHTTPClientTransport for communication
- **Session-based**: Maintains session state via mcp-session-id header
- **Standardized Interfaces**: 
  - `listTools()`: Get available tools
  - `callTool()`: Execute a tool
  - Other resources: resources, templates, etc.

#### MCP in OAP Architecture

```
┌────────────────────┐
│   AI Model/Agent   │
│   (makes decisions)│
└────────┬───────────┘
         │
         │ Uses
         ▼
┌────────────────────┐
│  OAP Web App       │
│ (useMCP hook)      │
└────────┬───────────┘
         │
         │ MCP Protocol
         │ (HTTP)
         ▼
┌────────────────────┐
│  MCP Server        │
│  (/oap_mcp)        │
└────────┬───────────┘
         │
         │ Routes to
         ▼
┌────────────────────┐
│  Tool Providers    │
│  (implementations) │
└────────────────────┘
```

#### MCP Implementation in useMCP Hook

From `apps/web/src/hooks/use-mcp.tsx`:

```typescript
import { 
  StreamableHTTPClientTransport 
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export default function useMCP({ name, version }) {
  // Cache MCP client to maintain stable session
  // CRITICAL FIX: Previously created new Client per call → new session ID
  // Now: Single Client instance reused → same session ID → workspace persists
  const mcpClientRef = useRef<Client | null>(null);

  const getOrCreateClient = async (): Promise<Client> => {
    if (mcpClientRef.current) {
      return mcpClientRef.current;
    }

    const url = getMCPUrlOrThrow();
    const connectionClient = new StreamableHTTPClientTransport(new URL(url));
    const mcp = new Client({ name, version });

    await mcp.connect(connectionClient);
    mcpClientRef.current = mcp;

    return mcp;
  };

  // List tools
  const getTools = async (nextCursor?: string): Promise<Tool[]> => {
    const mcp = await getOrCreateClient();
    const tools = await mcp.listTools({ cursor: nextCursor });
    
    if (tools.nextCursor) setCursor(tools.nextCursor);
    return tools.tools;
  };

  // Call a tool
  const callTool = async ({
    name,
    args,
    version,
  }: {
    name: string;
    args: Record<string, any>;
    version?: string;
  }) => {
    const mcp = await getOrCreateClient();
    const response = await mcp.callTool({
      name,
      version,
      arguments: args,
    });
    return response;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mcpClientRef.current) {
        mcpClientRef.current.close?.();
        mcpClientRef.current = null;
      }
    };
  }, []);

  return {
    getTools,
    callTool,
    tools,
    setTools,
    cursor,
  };
}
```

#### MCP Connection Details

- **Endpoint**: `{NEXT_PUBLIC_BASE_API_URL}/oap_mcp`
- **Transport**: HTTP (StreamableHTTPClientTransport)
- **Session Management**: 
  - Single Client instance per component lifecycle
  - Session ID preserved across tool calls
  - Enables workspace bindings and state persistence
- **Header**: `mcp-session-id` used for session identification

#### MCP to Tool Relationship

```
MCP Server
    │
    ├─ Tool Registry (available_tools)
    │   ├─ Tool Name
    │   ├─ Input Schema (JSON Schema)
    │   ├─ Description
    │   └─ Metadata (categories, agent prompts, etc.)
    │
    ├─ Tool Execution (callTool)
    │   ├─ Takes: tool name + arguments
    │   ├─ Returns: tool result
    │   └─ May require authentication
    │
    └─ Metadata Service
        ├─ Agent Prompts (recommended templates)
        ├─ Best Practices
        ├─ Common Pitfalls
        └─ Configuration Hints
```

---

### 7. Can tools be dragged and dropped?

**Current Implementation**: **NO** - Tools are not currently draggable and droppable.

**Analysis**:
- No `drag`, `drop`, or `draggable` attributes found in tool components
- No react-dnd or similar drag-drop library usage in tool features
- Tool selection uses: Toggle switches, comboboxes, checkboxes

**Tool Selection Methods (Current)**:
1. **In Playground**: Dropdown combobox to select active tool
2. **In Agent Config**: Toggle switches to enable/disable tools
3. **In Agent Form**: Displayed as list with search and pagination

**Potential Future Enhancement**:
If drag-and-drop is needed, candidates for implementation:
- **In Playground**: Drag tools from explorer to playground
- **In Agent Config**: Drag tools to reorder or prioritize
- **In Builder/Graph**: Drag tool nodes to canvas (like LangGraph builder)

**Related Libraries** (already in dependencies):
- `@xyflow/react`: Used for graph visualization (could extend for tools)
- `react-flow-smart-edge`: Edge rendering for flows

---

### 8. How are tool metadata and schemas handled?

#### Tool Metadata Structure

**Complete Metadata Hierarchy**:

```typescript
// Core Tool Definition
export interface Tool {
  name: string;                    // "web_search"
  description?: string;            // "Search the web for information"
  inputSchema: InputSchema;         // JSON Schema for inputs
  metadata?: ToolMetadata;          // Rich metadata
}

// Input Schema (JSON Schema compatible)
export type InputSchema = {
  type: "object";
  properties?: Record<string, any>;  // {query: {type: string}, ...}
  required?: string[];              // ["query"]
};

// Tool Metadata (from MCP server)
export interface ToolMetadata {
  mcp_server?: string;              // "web_search_server"
  original_name?: string;           // Name before prefixing
  tool_categories?: string[];       // ["search", "web", "info"]
  agent_prompts?: AgentPromptsMetadata;
}

// Agent Prompt Recommendations
export interface AgentPromptsMetadata {
  available_templates: PromptTemplateSummary[];
  general_best_practices?: string[];
  common_pitfalls?: string[];
  configuration_hints?: Record<string, string>;
}

// Prompt Template Summary
export interface PromptTemplateSummary {
  key: string;                      // "research_assistant"
  name: string;                     // "Research Assistant"
  description: string;              // When to use
  recommended_for?: string[];       // ["market_research", ...]
}
```

#### Schema Handling in Forms

**SchemaForm Component** (`schema-form.tsx`):
- Renders form fields based on JSON schema
- Supports:
  - Text inputs
  - Number inputs with optional sliders (min/max)
  - Boolean toggles
  - Enum dropdowns
  - Default values from schema
  - Required field validation UI (red asterisk)

```typescript
export function SchemaForm({ schema, onChange, values }: SchemaFormProps) {
  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(
        ([name, property]: [string, any]) => {
          const isRequired = schema.required?.includes(name);
          const label = property.title || name;
          const description = property.description;

          return (
            <div key={name} className="space-y-2">
              <Label className={isRequired ? "required" : ""}>
                {_.startCase(label)}
              </Label>
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
              {renderField(name, property, values[name], onChange)}
            </div>
          );
        },
      )}
    </div>
  );
}

// Field type mapping
switch (property.type) {
  case "string":
    return <Input placeholder={property.example} />;
  
  case "number" | "integer":
    if (property.minimum && property.maximum) {
      return <Slider min={minimum} max={maximum} />;
    }
    return <Input type="number" />;
  
  case "boolean":
    return <Switch />;
  
  default:
    return <Input />;
}
```

#### Schema Rendering in Details

**SchemaRenderer Component** (`schema-renderer.tsx`):
- Displays schema as hierarchical tree
- Features:
  - Expandable/collapsible nested objects and arrays
  - Color-coded type badges (string: green, number: blue, boolean: purple, etc.)
  - Required field badges (red)
  - Enum value display
  - Description tooltips

```typescript
export function SchemaRenderer({ schema }: SchemaRendererProps) {
  return (
    <Card>
      <CardContent>
        <div className="mb-2 text-sm font-medium">Schema</div>
        {schema.properties && 
          Object.entries(schema.properties).map(([key, value]) => (
            <PropertyItem
              key={key}
              name={key}
              value={value}
              isRequired={schema.required?.includes(key) || false}
              depth={0}
            />
          ))
        }
      </CardContent>
    </Card>
  );
}

function PropertyItem({ name, value, isRequired, depth }: Props) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isExpandable = value.type === "object" || value.type === "array";

  return (
    <div className={cn("border-l-2 pl-3", depth > 0 ? "mt-2 ml-4" : "")}>
      <div className="flex items-start gap-2">
        {isExpandable && (
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </button>
        )}
        
        <span className="font-medium">{name}</span>
        <Badge className={getTypeColor(value.type)}>
          {value.type}
        </Badge>
        
        {isRequired && (
          <Badge className="bg-red-100">required</Badge>
        )}
        
        {value.description && (
          <span className="text-xs text-gray-500">{value.description}</span>
        )}
      </div>

      {isExpanded && value.type === "object" && value.properties && (
        <div className="mt-2 space-y-1">
          {Object.entries(value.properties).map(([key, subValue]) => (
            <PropertyItem
              key={key}
              name={key}
              value={subValue}
              isRequired={value.required?.includes(key) || false}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {isExpanded && value.type === "array" && value.items && (
        <div className="mt-2 ml-2 border-l-2 pl-3">
          <PropertyItem
            name="items"
            value={value.items}
            isRequired={false}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
}
```

#### Metadata Display in Tool Details

**ToolMetadataView Component** (`tool-metadata-view.tsx`):

```typescript
export function ToolMetadataView({ tool }: ToolMetadataViewProps) {
  const { available_templates, general_best_practices, common_pitfalls, configuration_hints }
    = tool.metadata?.agent_prompts || {};

  return (
    <div className="space-y-6">
      {/* Agent Modes Section */}
      {available_templates && (
        <AgentModesSection templates={available_templates} />
      )}

      {/* Best Practices (collapsible, green) */}
      {general_best_practices && (
        <CollapsibleSection title="Best Practices">
          {general_best_practices.map((practice, i) => (
            <div className="bg-green-50 p-3">
              <MarkdownText>{practice}</MarkdownText>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Common Pitfalls (collapsible, yellow) */}
      {common_pitfalls && (
        <CollapsibleSection title="Common Pitfalls">
          {common_pitfalls.map((pitfall, i) => (
            <div className="bg-yellow-50 p-3">
              <MarkdownText>{pitfall}</MarkdownText>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Configuration Requirements (collapsible, blue) */}
      {configuration_hints && (
        <CollapsibleSection title="Configuration Requirements">
          {Object.entries(configuration_hints).map(([key, hint]) => (
            <div className="bg-muted p-3">
              <p className="font-mono text-xs font-semibold">{key}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </CollapsibleSection>
      )}
    </div>
  );
}
```

#### Agent Prompts Integration

Agent prompts are fetched on-demand from the MCP server:

```typescript
// File: apps/web/src/lib/prompt-api.ts
export async function fetchPromptTemplate(
  mcpServer: string,
  templateKey: string,
): Promise<FullPromptTemplate> {
  // Fetch full prompt template from backend
  const response = await fetch(
    `/api/prompts/${mcpServer}/${templateKey}`
  );
  return response.json();
}

// Returns:
export interface FullPromptTemplate {
  name: string;
  description: string;
  system_prompt: string;              // Full system prompt text
  tool_usage_guidelines?: string[];  // How to use tools
  example_queries?: string[];        // Example queries
}
```

---

## Part 3: Key Patterns

### Pattern 1: Session-Stable MCP Connection

**Problem**: Creating a new MCP client per tool call resulted in new session IDs, losing workspace bindings.

**Solution**: Cache single Client instance across component lifecycle.

```typescript
// CRITICAL FIX Implementation
const mcpClientRef = useRef<Client | null>(null);

const getOrCreateClient = async (): Promise<Client> => {
  if (mcpClientRef.current) {
    return mcpClientRef.current;
  }
  
  // Create once per component
  const connectionClient = new StreamableHTTPClientTransport(url);
  const mcp = new Client({ name, version });
  await mcp.connect(connectionClient);
  
  // Cache it
  mcpClientRef.current = mcp;
  
  return mcp;
};

// Every tool call reuses the cached client
const getTools = async (cursor?: string) => {
  const mcp = await getOrCreateClient(); // Reuses cached
  return mcp.listTools({ cursor });
};
```

### Pattern 2: Debounced Tool Search

**Pattern**: Debounced search to reduce re-renders and improve performance.

```typescript
const debouncedSetSearchTerm = useMemo(
  () => debounce((value: string) => setToolSearchTerm(value), 200),
  [],
);

// Filter logic
const filteredTools = useMemo(() => {
  if (!toolSearchTerm) return tools;
  return tools.filter((tool) =>
    _.startCase(tool.name)
      .toLowerCase()
      .includes(toolSearchTerm.toLowerCase())
  );
}, [tools, toolSearchTerm]);
```

### Pattern 3: Tool Prioritization in Agent Config

**Pattern**: Show pre-selected tools first in dropdown/list.

```typescript
export function useSearchTools(tools, { preSelectedTools }) {
  const filteredTools = useMemo(() => {
    if (!toolSearchTerm) return tools;
    return tools.filter(t => 
      _.startCase(t.name).toLowerCase().includes(toolSearchTerm.toLowerCase())
    );
  }, [tools, toolSearchTerm]);

  // Prioritize pre-selected
  const displayTools = useMemo(() => {
    const preSelectedSet = new Set(preSelectedTools || []);
    const result: Tool[] = [];
    const processed = new Set<string>();

    // First: pre-selected that match search
    filteredTools.forEach((tool) => {
      if (preSelectedSet.has(tool.name) && !processed.has(tool.name)) {
        result.push(tool);
        processed.add(tool.name);
      }
    });

    // Then: all other matching tools
    filteredTools.forEach((tool) => {
      if (!processed.has(tool.name)) {
        result.push(tool);
        processed.add(tool.name);
      }
    });

    return result;
  }, [filteredTools, preSelectedTools]);

  return { filteredTools: displayTools, toolSearchTerm };
}
```

### Pattern 4: Tool Selection via Toggle Switches

**Pattern**: State-based tool selection with immediate feedback.

```typescript
export function ConfigFieldTool({ label, agentId, toolId, setValue }) {
  const checked = defaults.tools?.some((t) => t === label);

  const handleCheckedChange = (checked: boolean) => {
    const newValue = checked
      ? {
          ...defaults,
          tools: Array.from(new Set([...(defaults.tools || []), label])),
        }
      : {
          ...defaults,
          tools: defaults.tools?.filter((t) => t !== label),
        };

    store.updateConfig(actualAgentId, toolId, newValue);
  };

  return (
    <div className="flex items-center justify-between">
      <Label>{_.startCase(label)}</Label>
      <Switch checked={checked} onCheckedChange={handleCheckedChange} />
    </div>
  );
}
```

### Pattern 5: Cursor-Based Pagination

**Pattern**: Load more tools on demand via cursor.

```typescript
const [cursor, setCursor] = useState("");
const [loadingMore, setLoadingMore] = useState(false);

const handleLoadMore = async () => {
  if (!cursor) return;
  
  setLoadingMore(true);
  try {
    const newTools = await getTools(cursor);
    setTools((prevTools) => [...prevTools, ...newTools]);
  } catch (error) {
    console.error("Error loading more tools:", error);
  } finally {
    setLoadingMore(false);
  }
};

// In MCP hook
const getTools = async (nextCursor?: string): Promise<Tool[]> => {
  const mcp = await getOrCreateClient();
  const tools = await mcp.listTools({ cursor: nextCursor });
  
  if (tools.nextCursor) {
    setCursor(tools.nextCursor);  // Store next cursor
  } else {
    setCursor("");  // No more tools
  }
  
  return tools.tools;
};
```

### Pattern 6: Dynamic Form Generation from JSON Schema

**Pattern**: Render form fields based on JSON Schema properties and types.

```typescript
function renderField(name, property, value, onChange) {
  // Check for enum first (most specific)
  if (property.enum) {
    return (
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {property.enum.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Then handle types
  switch (property.type) {
    case "string":
      return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    
    case "number":
    case "integer":
      if (property.minimum !== undefined && property.maximum !== undefined) {
        return (
          <Slider
            value={[value || property.minimum]}
            min={property.minimum}
            max={property.maximum}
            step={property.type === "integer" ? 1 : 0.1}
            onValueChange={(vals) => onChange(vals[0])}
          />
        );
      }
      return <Input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} />;
    
    case "boolean":
      return <Switch checked={!!value} onCheckedChange={onChange} />;
    
    default:
      return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
```

### Pattern 7: Expandable Schema Tree

**Pattern**: Recursive property rendering with expansion state.

```typescript
function PropertyItem({ name, value, isRequired, depth }) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isExpandable = value.type === "object" || value.type === "array";

  return (
    <div className={cn("border-l-2 pl-3", depth > 0 ? "mt-2 ml-4" : "")}>
      <div className="flex items-start gap-2" onClick={() => isExpandable && setIsExpanded(!isExpanded)}>
        {isExpandable && (
          <div>{isExpanded ? <ChevronDown /> : <ChevronRight />}</div>
        )}
        
        <span className="font-medium">{name}</span>
        <Badge className={getTypeColor(value.type)}>{value.type}</Badge>
        
        {isRequired && <Badge className="bg-red-100">required</Badge>}
        {value.description && <span className="text-xs text-gray-500">{value.description}</span>}
      </div>

      {/* Recursively render nested properties */}
      {isExpanded && value.type === "object" && value.properties && (
        <div className="mt-2 space-y-1">
          {Object.entries(value.properties).map(([subKey, subValue]) => (
            <PropertyItem
              key={subKey}
              name={subKey}
              value={subValue}
              isRequired={value.required?.includes(subKey) || false}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {isExpanded && value.type === "array" && value.items && (
        <div className="mt-2 ml-2 border-l-2 pl-3">
          <PropertyItem
            name="items"
            value={value.items}
            isRequired={false}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Part 4: Integration Points

### Integration Point 1: MCP Server Connection

**File**: `apps/web/src/hooks/use-mcp.tsx`

**Responsibility**: 
- Establish HTTP connection to MCP server
- Manage Client lifecycle
- Expose tool listing and execution methods

**Connected Components**:
- MCPProvider (wraps hook)
- All components using useMCPContext

**API Contract**:
- Endpoint: `{NEXT_PUBLIC_BASE_API_URL}/oap_mcp`
- Methods: `listTools(cursor?)`, `callTool(name, args)`

---

### Integration Point 2: MCPProvider to Application

**File**: `apps/web/src/providers/MCP.tsx`

**Responsibility**:
- Provide MCP state to entire app via Context
- Initialize tool loading on mount
- Manage loading state

**Usage**:
```typescript
// Wrap app
<MCPProvider>
  <Routes />
</MCPProvider>

// Use anywhere
const { tools, getTools, callTool, loading } = useMCPContext();
```

**Connected Components**:
- ToolsInterface
- ToolsPlaygroundInterface
- ConfigurationSidebar (agent config)

---

### Integration Point 3: Agent Configuration System

**File**: `apps/web/src/features/chat/components/configuration-sidebar/`

**Responsibility**:
- Render tool selection UI
- Persist selected tools to Zustand store
- Update agent configuration

**Connected to**:
- Zustand store (`use-config-store`)
- Agent update API (`useAgents`)
- MCP context (for available tools list)

**Tool Configuration Structure**:
```typescript
configsByAgentId[agentId + ':selected-tools'][toolId] = {
  tools: ['tool1', 'tool2', ...]
}
```

---

### Integration Point 4: LangGraph Backend

**Contract**:
- Send selected tools array when saving agent
- Backend stores in agent deployment
- Backend includes tool descriptions in system prompt

**Flow**:
1. User selects tools in config sidebar
2. Zustand store updates
3. User saves configuration
4. `updateAgent()` called with `config.tools: string[]`
5. Backend stores and deploys
6. Agent prompt generated with tool definitions

---

### Integration Point 5: Tool Metadata Service

**File**: `apps/web/src/lib/prompt-api.ts`

**Responsibility**:
- Fetch full prompt templates on demand
- Estimate token counts
- Display comprehensive tool guidance

**Integration**:
- Called from ToolMetadataView when viewing full prompt
- Backend endpoint: `/api/prompts/{mcpServer}/{templateKey}`

---

## Part 5: Glossary

| Term | Definition |
|------|-----------|
| **MCP** | Model Context Protocol - open standard for AI to interact with tools |
| **Tool** | External capability with inputs/outputs accessible via MCP |
| **InputSchema** | JSON Schema defining tool input parameters |
| **ToolMetadata** | Rich metadata including descriptions, categories, agent prompts |
| **AgentPrompts** | Recommendations for how agents should use a specific tool |
| **MCP Server** | Backend service exposing tools via MCP protocol |
| **Session ID** | Identifier for persistent MCP connection across tool calls |
| **Cursor** | Token for pagination in large tool lists |
| **ToolCard** | UI component displaying tool summary with links to details/playground |
| **SchemaForm** | Dynamic form generated from JSON schema for tool inputs |
| **ResponseViewer** | Component displaying tool execution results in pretty/raw format |
| **ConfigFieldTool** | Toggle switch UI for selecting tools in agent configuration |
| **Playground** | Interface for testing tools before using in agents |
| **Debounce** | Delay search execution to reduce re-renders (200ms in this app) |
| **Zustand Store** | Client-side state management for agent configurations |
| **Collapsible** | UI component for show/hide sections (best practices, pitfalls) |

---

## Part 6: Data Flow Diagrams

### Flow 1: Tool Discovery and Display

```
User navigates to /tools
    ▼
MCPProvider mounts
    ▼
useMCP() initialized with { name: "Tools Interface", version: "1.0.0" }
    ▼
getOrCreateClient() 
    - Creates StreamableHTTPClientTransport
    - Connects to {API_URL}/oap_mcp
    - Caches Client in ref
    ▼
getTools() called
    - MCP.listTools({ cursor: null })
    ▼
MCP Server responds: { tools: Tool[], nextCursor?: string }
    ▼
setTools(tools) - updates React state
    ▼
ToolsInterface renders
    - Displays tool grid
    - Search bar active
    - Load More button (if cursor)
```

### Flow 2: Tool Selection in Agent Config

```
User opens Configuration Sidebar
    ▼
Agent ID determined from URL
    ▼
useAgentConfig() fetches tool configurations
    ▼
useMCPContext() provides available tools
    ▼
useSearchTools() filters tools
    ▼
displayTools shown with:
    - Pre-selected tools first
    - Toggle switches per tool
    ▼
User toggles tool ON
    ▼
ConfigFieldTool.handleCheckedChange()
    ▼
Store.updateConfig(agentId + ':selected-tools', toolId, { tools: [...] })
    ▼
Zustand state updated
    ▼
UI re-renders (toggle shows checked)
    ▼
User saves agent
    ▼
updateAgent() API call with config
    ▼
Backend stores tool selection
```

### Flow 3: Tool Execution in Playground

```
User navigates to /tools/playground?tool=web_search
    ▼
ToolsPlaygroundInterface mounts
    ▼
Query param parsed: selectedToolName = "web_search"
    ▼
useEffect watches tools array
    ▼
Tools found: tool = tools.find(t => t.name === "web_search")
    ▼
selectedTool set (triggers form rendering)
    ▼
SchemaForm renders based on tool.inputSchema
    ▼
User fills in inputs (e.g., query="anthropic")
    ▼
User clicks "Run Tool"
    ▼
handleSubmit():
    - callTool({ name: "web_search", args: { query: "anthropic" } })
    ▼
useMCP.callTool()
    - getOrCreateClient() (reuses cached)
    - mcp.callTool({ name, arguments: args })
    ▼
MCP Server executes tool
    ▼
Returns response (success or error)
    ▼
ResponseViewer displays:
    - Loading spinner clears
    - Response shown in Pretty or Raw view
```

---

## Part 7: Current Limitations and Future Considerations

### Current Limitations

1. **No Drag-and-Drop Support**
   - Tools selected via toggles/comboboxes only
   - Could enhance UX with drag ordering

2. **Limited Tool Filtering**
   - Only searches by name
   - No category/tag filtering yet
   - No sorting options (alphabetical, recently used, etc.)

3. **Static Token Estimation**
   - Token count for prompts is estimated
   - No real tokenizer integration yet

4. **No Tool Caching**
   - Tools re-fetched on page reload
   - No persistent client-side cache

5. **Linear Tool List**
   - No grouping or categorization
   - Large tool sets may be unwieldy

### Future Enhancement Opportunities

1. **Advanced Search/Filtering**
   - Filter by category
   - Filter by required parameters
   - Filter by authentication status

2. **Tool Recommendations**
   - Show "most used" tools
   - Show "recommended for your agent"
   - Show "compatible with current model"

3. **Tool Composition**
   - Create macro tools from multiple tools
   - Chain tool outputs to inputs
   - Conditional tool execution

4. **Drag-and-Drop**
   - Drag tools to reorder priority
   - Drag from explorer to playground
   - Drag tool nodes in agent builder

5. **Rich Tool Preview**
   - Live examples of tool outputs
   - Tool statistics (usage count, success rate)
   - Related tools suggestions

6. **Authentication Management**
   - UI for managing tool credentials
   - OAuth flow integration
   - Credential expiry warnings

---

## Part 8: Testing and Validation Scenarios

### Test Scenario 1: Tool Discovery
- Navigate to `/tools`
- Verify tools load within 2 seconds
- Verify correct tool count displays
- Test pagination with "Load More"
- Test search filtering

### Test Scenario 2: Tool Details
- Open tool details dialog
- Verify schema displays correctly
- Verify all property types render
- Check nested objects expand properly
- Verify agent modes display

### Test Scenario 3: Tool Playground
- Navigate to `/tools/playground?tool={toolName}`
- Verify form renders based on schema
- Test filling in all field types
- Run tool and verify response
- Test error handling

### Test Scenario 4: Agent Configuration
- Open configuration sidebar
- Search for tools
- Toggle tools on/off
- Verify toggle state persists
- Save agent and verify backend received selection

---

## Conclusion

The OAP Tool Management System provides a sophisticated interface for managing external tools via MCP. Key strengths include session-stable client connection, flexible schema-based forms, comprehensive metadata display, and seamless agent integration. The architecture cleanly separates concerns and provides a strong foundation for future enhancements like drag-and-drop, advanced filtering, and tool composition.
