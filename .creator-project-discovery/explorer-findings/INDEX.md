# OAP Tool Management System - Discovery Index

## Main Discovery Document

**File**: `agent3-tools-mcp.md` (54 KB, 1698 lines)

This comprehensive discovery report contains all findings about the OAP Tool Management System, covering tools, MCP integration, UI components, and architecture.

---

## Quick Reference

### Quick Answers

1. **What are "tools"?**
   - External capabilities exposed via Model Context Protocol (MCP)
   - Each has: name, description, inputSchema, optional metadata
   - Agents can call tools to accomplish tasks

2. **How are tools registered?**
   - Discovered dynamically from MCP server at `{API_URL}/oap_mcp`
   - Pagination support with cursor-based navigation
   - Session persistence via cached MCP Client

3. **Tool Configuration Storage**
   - Backend MCP server (host)
   - React state (useMCP hook)
   - Zustand store (agent-specific)
   - LangGraph deployment (persistent)

4. **Agent Integration**
   - Toggle switches in configuration sidebar
   - Stored in Zustand
   - Saved to backend
   - Included in agent system prompt

5. **UI Interfaces**
   - Tools Explorer (`/tools`): Browse and view all tools
   - Tools Playground (`/tools/playground`): Test tools
   - Agent Config: Select tools for agents
   - Tool Details: View schemas and metadata

6. **MCP (Model Context Protocol)**
   - Open standard for AI-tool interaction
   - HTTP transport via StreamableHTTPClientTransport
   - Session-based (session ID preserved)
   - Provides: listTools(), callTool() methods

7. **Drag-and-Drop**
   - NOT currently implemented
   - Selected via toggles, comboboxes, checkboxes
   - Potential future enhancement

8. **Metadata & Schemas**
   - JSON Schema for inputs
   - Dynamic form generation
   - Type-based field rendering
   - Hierarchical schema viewer
   - Includes best practices, pitfalls, config hints

---

## Key Files Explored

### Core Components
- `apps/web/src/features/tools/index.tsx` - Main tools explorer
- `apps/web/src/features/tools/playground/index.tsx` - Tool tester
- `apps/web/src/features/tools/components/tool-card/index.tsx` - Tool display
- `apps/web/src/features/tools/components/tool-details-dialog/index.tsx` - Details modal
- `apps/web/src/features/tools/components/tool-metadata-view.tsx` - Metadata display
- `apps/web/src/features/tools/playground/components/schema-form.tsx` - Input form
- `apps/web/src/features/tools/playground/components/response-viewer.tsx` - Output display
- `apps/web/src/features/tools/components/tool-list-command.tsx` - Tool selector dropdown

### Hooks & Providers
- `apps/web/src/hooks/use-mcp.tsx` - Main MCP hook (critical)
- `apps/web/src/hooks/use-search-tools.tsx` - Search/filter logic
- `apps/web/src/providers/MCP.tsx` - MCP context provider

### Types
- `apps/web/src/types/tool.ts` - Tool type definitions

### Integration Points
- `apps/web/src/features/chat/components/configuration-sidebar/` - Agent config
- `apps/web/src/features/agents/components/create-edit-agent-dialogs/agent-form.tsx` - Agent form

---

## Report Sections

### Part 1: Domain Map
- Architecture overview diagram
- Component hierarchy
- Layer descriptions

### Part 2: Question Answers (8 detailed sections)
1. What are "tools" in OAP?
2. How are tools registered/discovered?
3. Where are tool configurations stored?
4. How do tools integrate with agents?
5. What UI exists for tool management?
6. What is MCP and how does it relate to tools?
7. Can tools be dragged and dropped?
8. How are tool metadata and schemas handled?

### Part 3: Key Patterns
- Session-stable MCP connection
- Debounced tool search
- Tool prioritization
- Tool selection via toggles
- Cursor-based pagination
- Dynamic form generation
- Expandable schema trees

### Part 4: Integration Points
- MCP server connection
- MCPProvider to application
- Agent configuration system
- LangGraph backend
- Tool metadata service

### Part 5: Complete Glossary
Terms and definitions (MCP, tool, schema, session, etc.)

### Part 6: Data Flow Diagrams
- Tool discovery and display
- Tool selection in agent config
- Tool execution in playground

### Part 7: Limitations & Future Opportunities
- Current limitations (no drag-drop, limited filtering)
- Enhancement ideas (advanced search, recommendations, composition)

### Part 8: Testing & Validation Scenarios
Test cases for each major feature

---

## Architecture Summary

```
User Interface Layer
    ↓
React Hooks (useMCP, useSearchTools)
    ↓
Context Providers (MCPProvider)
    ↓
Type System (Tool, InputSchema, ToolMetadata)
    ↓
MCP SDK Client
    ↓
HTTP Transport (StreamableHTTPClientTransport)
    ↓
MCP Server Backend (/oap_mcp)
```

---

## Key Technical Insights

### Critical: Session Persistence
The single most important architectural decision is caching the MCP Client instance. Creating a new client per call caused new session IDs, losing workspace bindings. This is documented as "CRITICAL FIX" in the useMCP hook.

### Tool Selection Pattern
Tools are selected via toggle switches that immediately update a Zustand store. This is different from typical form submission, providing real-time feedback.

### Schema-Driven Forms
Input forms are dynamically generated from JSON Schema properties, supporting type inference and rendering appropriate UI controls.

### Pagination Strategy
Cursor-based pagination with user-triggered "Load More" buttons allows efficient handling of large tool sets.

---

## Navigation

- **For Architecture Understanding**: Start with Part 1: Domain Map
- **For Implementation Details**: Read Part 2: Question Answers
- **For Common Patterns**: Review Part 3: Key Patterns
- **For Integration Points**: Study Part 4: Integration Points
- **For Data Flows**: Examine Part 6: Data Flow Diagrams
- **For Glossary**: Reference Part 5 for terminology

---

## Document Statistics

- **Total Lines**: 1698
- **File Size**: 54 KB
- **Sections**: 8 major parts
- **Code Examples**: 40+
- **Diagrams**: 5
- **Glossary Entries**: 20+
- **Files Analyzed**: 15+

---

Generated: 2025-10-24
Thoroughness Level: Very Thorough
Status: Complete
