# Creator Feature - Project Glossary

**Version:** 1.0
**Date:** 2025-10-24
**Status:** Complete

---

## A

**Agent (OAP Context)**
A configured LangGraph application with metadata including name, description, model selection, tool bindings, system prompts, and graph type. Executed by the OAP backend runtime and accessible via the chat interface.

**Agent (langgraph-builder Context)**
A visual graph design on the canvas representing a LangGraph workflow architecture. Composed of nodes and edges. Exported as YAML specification and code stubs but not executed within langgraph-builder itself.

**Agent Form**
UI component in OAP for creating or editing agent configurations. Located in `features/agents/components/create-edit-agent-dialogs/agent-form.tsx`. Includes fields for name, model, tools, prompts, and graph type.

**AI Builder Mode**
One of two primary modes in the Creator feature. Focused on visual design and configuration of agent workflows. Includes canvas, tool palettes, agent configuration panels, and deployment capabilities.

**API Endpoint**
HTTP endpoint for backend communication. OAP uses RESTful patterns. Key endpoints include `/oap_mcp` (tools), `/api/chat` (execution), agent management APIs.

---

## B

**Blueprint**
Visual representation of a graph on the canvas. Includes nodes, edges, labels, colors, and layout. In langgraph-builder, serves as the design artifact that gets exported to code. No execution happens at the blueprint level.

**ButtonEdge**
Standard edge type in React Flow with interactive buttons for labeling and deletion. Used in langgraph-builder for direct connections between nodes.

**Button Text Context**
React Context in langgraph-builder managing node button labels. One of four contexts used for canvas state management.

---

## C

**Canvas**
Interactive visual workspace powered by React Flow (@xyflow/react) where graphs are designed. Supports drag-and-drop, pan, zoom, node creation (Cmd+Click), edge connections, inline editing.

**Checkpoint**
Saved state during agent execution. Used for resuming conversations, branching execution paths, and debugging.

**Cmd+Click**
Primary interaction for creating new nodes on the canvas. User holds Cmd (Mac) or Ctrl (Windows) and clicks empty space to spawn a new custom node.

**Comments System**
Planned feature (not yet implemented) for attaching notes, annotations, and discussion threads to canvas elements (nodes, edges). Should support multi-element attachment per requirements.

**Component-Based Architecture**
OAP's frontend organization pattern. Features are self-contained modules with their own components, hooks, types. Follows feature-first rather than layer-first organization.

**Conditional Edge**
Edge representing branching logic in a graph. Visually animated in langgraph-builder to distinguish from direct edges. Maps to LangGraph conditional transitions.

**Configuration Sidebar**
Panel in chat interface for configuring agent settings, selecting tools, and managing execution parameters.

**Context Provider**
React pattern for sharing state across component tree without prop drilling. langgraph-builder uses 4: ButtonText, EdgeLabel, Editing, ColorEditing. OAP uses for Agents, MCP, and other features.

**Creator**
The new integrated feature combining langgraph-builder's visual design capabilities with OAP's execution platform. Two modes: AI Builder (agent design) and Deployments (system architecture).

**Cursor Pagination**
Pagination pattern using opaque cursors instead of page numbers. Used by MCP for tool discovery. More efficient for large datasets and supports real-time data changes.

**Custom Node**
User-created node type in langgraph-builder representing a workflow step. Has random HSL-based color, editable label, and interactive buttons.

---

## D

**Deployment**
Running instance of a LangGraph agent in the OAP backend. Created from agent configuration. Accessible via chat interface. Has unique ID and associated resources (tools, RAG collections).

**Deployments Mode**
Second mode in Creator feature. Visualizes system architecture with frontend components and backend services as nodes. Allows configuration editing and shows cross-system connections.

---

## E

**Edge**
Connection between two nodes on the canvas. Represents state transition, control flow, or data flow. Three types in langgraph-builder: ButtonEdge (standard), SelfConnectingEdge (cyclic), conditional (animated).

**Edge Label**
Text annotation on an edge. Stored in EdgeLabelContext in langgraph-builder. Can describe the transition condition or purpose.

**Edge Label Context**
React Context managing edge labels separately from XyFlow edge state. Allows non-structural metadata to be managed independently.

**End Node**
Special node (`__end__`) representing workflow exit point. Red colored, not removable, always present. Maps to LangGraph's END state.

**Export**
Process of transforming visual canvas into code/configuration. langgraph-builder exports to YAML + Python + TypeScript. Creator will export/deploy to OAP backend instead.

**Execution**
Running an agent with specific input. Triggered from chat interface. Backend runs LangGraph runtime. Results stream back to frontend in real-time.

---

## F

**Feature Module**
Self-contained directory under `apps/web/src/features/` containing all code for a specific feature (agents, chat, tools, etc.). Includes components, hooks, types, and sometimes providers.

**Flow.tsx**
Main component in langgraph-builder (1364 lines). Orchestrates entire canvas including node/edge management, validation, code generation, modal display, onboarding.

---

## G

**Graph**
Directed graph of nodes and edges representing an agent's workflow. In OAP, executed by LangGraph runtime. In langgraph-builder, visual design artifact.

**Graph Type**
Category of agent workflow pattern. Examples: StateGraph, MessageGraph, Supervisor pattern, Sequential, Router, Feedback Loop.

---

## H

**Handoff**
Process of transferring control from one agent to another in multi-agent systems. Mentioned in requirements but implementation details not yet discovered.

**Hook**
React custom hook for encapsulating stateful logic. OAP hooks prefixed with `use-` (e.g., `use-mcp.tsx`, `use-rag.tsx`). Located in `src/hooks/` for shared hooks.

---

## I

**Inline Editing**
Ability to edit node/edge properties directly on canvas without opening separate dialog. langgraph-builder supports inline editing of labels and colors.

**Input Schema**
JSON Schema describing parameters a tool accepts. Used for dynamic form generation, validation, and type checking. Displayed in tool details dialog.

---

## L

**LangGraph**
Framework for building stateful, multi-agent applications as directed graphs. Developed by LangChain. Python-based. Used as execution runtime in OAP backend.

**langgraph-builder**
Standalone Next.js application for visual LangGraph workflow design. Exports to YAML + code. No backend execution. Being integrated into OAP as Creator feature.

**langgraph-gen**
External API service that generates Python and TypeScript boilerplate code from YAML graph specifications. Called by langgraph-builder during export.

---

## M

**MCP (Model Context Protocol)**
Open standard for connecting AI systems to external tools and data sources. OAP uses MCP SDK for tool discovery and invocation. Server at `/oap_mcp` endpoint.

**MCP Client**
SDK client instance connecting to MCP server. **CRITICAL:** Must be cached/reused. Creating new client = new session = lost workspace bindings.

**MCP Provider**
React Context Provider wrapping MCP client. Makes client accessible throughout component tree. Ensures session stability.

**Metadata**
Additional information about a tool beyond name/description/schema. Includes: categories, tags, best practices, known pitfalls, configuration hints, example uses.

**Modal**
Overlay dialog for displaying detailed information or forms. langgraph-builder uses GenericModal for code display, onboarding, errors.

**Multi-Select**
Ability to select multiple canvas elements simultaneously. Required for comment system (attach comment to multiple nodes/edges). Not yet implemented in langgraph-builder.

---

## N

**Node**
Step in a graph representing computation, decision, or action. Four types in langgraph-builder: Source (`__start__`), End (`__end__`), Custom (user-defined), PositionLogger (debug).

**Nodes State**
React Flow state management hook (`useNodesState`) for managing node array and change handlers. Returns: nodes array, setNodes function, onNodesChange handler.

---

## O

**OAP (Open-Agent-Platform)**
Full-stack platform for creating, managing, and executing LangGraph agents. Includes frontend (Next.js), backend (Python/LangGraph), database (Postgres), and integrated features (tools, RAG, chat).

**Onboarding**
Interactive tutorial in langgraph-builder guiding new users through canvas features. Multi-step walkthrough with tooltips and demo actions.

**Orchestrator**
System component coordinating execution of multi-agent workflows. Referenced in `OAP_ORCHESTRATOR_ARCHITECTURE.md`. Manages agent lifecycle, state transitions, resource allocation.

---

## P

**Palette**
Panel containing draggable elements (agents, tools, templates) that can be added to canvas. Planned feature for Creator - not in langgraph-builder.

**Persistence**
Saving canvas/graph state to database for later retrieval. langgraph-builder lacks persistence (data lost on refresh). Creator will add persistence via OAP database.

**Position Logger**
Debug node type in langgraph-builder that logs position changes. Not intended for production use.

**Prompt**
Text instruction/context provided to LLM during execution. In OAP: system prompts (agent personality), user prompts (messages), template prompts. Prompt compilation system exists (`lib/prompt-compiler.ts`).

**Prompt Mode**
Different prompt configuration strategies. Managed by `use-prompt-modes.tsx` hook. Details not fully explored but suggests flexible prompt management.

**Provider Composition**
Pattern of nesting multiple Context Providers to combine their functionality. langgraph-builder wraps app in 4 providers. OAP has providers for Agents, MCP, etc.

---

## R

**RAG (Retrieval-Augmented Generation)**
Technique for augmenting LLM responses with retrieved documents from a knowledge base. OAP has RAG system with collections, but UI implementation partially complete.

**RAG Collection**
Set of indexed documents available for retrieval. Associated with agents to provide domain knowledge. Creation/management UI not fully visible in current codebase.

**React Flow**
Library powering the canvas. Official package name: `@xyflow/react` (v12.2.0). Provides node/edge rendering, interactions, layouts, plugins.

**Ref Sync Pattern**
Pattern in langgraph-builder keeping refs updated with state for use in callbacks. Prevents stale closure issues.

```typescript
const stateRef = useRef(state);
useEffect(() => { stateRef.current = state; }, [state]);
```

**Router**
Node or pattern that conditionally directs flow to different branches based on state/input. Supported in LangGraph, can be represented in langgraph-builder as conditional edges.

---

## S

**Self-Connecting Edge**
Edge where source and target are the same node. Represents cyclic behavior (loops, retries). Special component `SelfConnectingEdge.tsx` handles rendering.

**Session ID**
Unique identifier for an MCP client connection. **CRITICAL:** Must remain stable throughout session. New session = lost workspace bindings and tool state.

**Side Panel**
Contextual panel appearing when canvas element is selected. Planned for Creator to show configuration options, properties, actions. Not in langgraph-builder.

**Source Node**
Special node (`__start__`) representing workflow entry point. Green colored, not removable, always present. Maps to LangGraph's START state.

**Spec (YAML Specification)**
Language-agnostic format for describing graph structure. Includes nodes, edges, conditions, labels. Generated by `generateSpec()` function. Input to langgraph-gen service.

**Streaming**
Real-time delivery of execution results as they become available. OAP uses SSE (Server-Sent Events) with polling. Managed by `useStream` hook and `Stream.tsx` provider.

**System Prompt**
Base instructions given to agent defining its personality, capabilities, constraints, and behavior. Configured in agent form, stored in agent config, sent to LLM during execution.

---

## T

**Template**
Pre-configured graph pattern serving as starting point. langgraph-builder includes: RAG Pipeline, Agent with Tools. Creator will expand with agent templates from OAP.

**Templates Panel**
UI component in langgraph-builder showing available templates. Click to load template onto canvas. Located in `src/components/TemplatesPanel.tsx`.

**Thread**
Conversation session in chat interface. Has unique ID, message history, associated agent, execution state. Managed via URL params and backend storage.

**Tool**
External capability (function, API, service) that an agent can call during execution. Defined by: name, description, inputSchema (JSON Schema), metadata. Discovered via MCP.

**Tool Card**
UI component displaying tool summary (name, description, tags). Located in `features/tools/components/tool-card/`. Clickable to open tool details dialog.

**Tool Details Dialog**
Modal showing comprehensive tool information including schema, metadata, examples. Located in `features/tools/components/tool-details-dialog/`.

**Tool Explorer**
OAP page (`/tools`) for browsing, searching, and viewing all available tools. Includes filtering, pagination, detail viewing.

**Tool Playground**
OAP page (`/tools/playground`) for testing tools. Select tool, fill parameters, execute, view results. Useful for debugging and learning tool behavior.

**Type System**
TypeScript type definitions. OAP types in `src/types/`. Key files: `tool.ts` (tools), `prompt.ts` (prompts), agent types, chat types. Ensures type safety across application.

---

## U

**useMCP**
**CRITICAL** React hook for accessing MCP client. Located in `apps/web/src/hooks/use-mcp.tsx`. Handles tool discovery, session management, caching. **Must maintain session stability.**

**useStream**
React hook for managing execution streaming. Handles SSE connection, polling, state updates, cleanup. Located in `features/chat/providers/Stream.tsx`.

---

## V

**Vi Builder**
Branded name for the open-agent-platform project. "Vi" suggests "visual interface" or personal branding. Will become the branded name for the Creator feature.

**Vector Store**
Database for storing document embeddings used in RAG. Specific implementation not visible in frontend code but referenced in documentation.

**Viewport**
Current view area of the canvas. Includes position (x, y) and zoom level. Saved with graph for restoring exact view when loading.

---

## W

**Workspace**
In MCP context, the environment/directory where tools operate. Bound to session ID. Losing session = losing workspace context.

---

## X

**XyFlow**
Another name for React Flow. Packages named `@xyflow/react` and `reactflow` (both used in langgraph-builder, suggesting transition between versions).

---

## Y

**YAML**
Human-readable data serialization format. Used for graph specifications in langgraph-builder. Structure includes nodes, edges, conditions. Generated by `generateSpec()`.

Example:
```yaml
nodes:
  - id: agent_1
    type: CustomNode
edges:
  - source: __start__
    target: agent_1
  - source: agent_1
    target: __end__
```

---

## Z

**Zustand**
Lightweight state management library. Used in OAP for agent-specific tool selection. Alternative to Redux/MobX with simpler API and smaller bundle size.

---

## Symbol

**__start__**
Reserved node ID for workflow entry point. Green colored Source node. Always present, not deletable. Maps to LangGraph START.

**__end__**
Reserved node ID for workflow exit point. Red colored End node. Always present, not deletable. Maps to LangGraph END.

---

## Acronyms

**API** - Application Programming Interface
**CSS** - Cascading Style Sheets
**HSL** - Hue, Saturation, Lightness (color model)
**HTTP** - Hypertext Transfer Protocol
**JSON** - JavaScript Object Notation
**LLM** - Large Language Model
**MCP** - Model Context Protocol
**OAP** - Open-Agent-Platform
**RAG** - Retrieval-Augmented Generation
**SDK** - Software Development Kit
**SSE** - Server-Sent Events
**UI** - User Interface
**URL** - Uniform Resource Locator
**UUID** - Universally Unique Identifier
**YAML** - YAML Ain't Markup Language

---

**Total Terms:** 100+
**Last Updated:** 2025-10-24
**Completeness:** 95%
