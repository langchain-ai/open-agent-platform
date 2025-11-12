# Creator Feature - Initial Requirements

**Date:** 2025-10-24
**Project:** Vi Builder (open-agent-platform) + langgraph-builder Integration

## Core Vision

Add/merge a version of the langgraph-builder into a new page in the open-agent-platform (Vi Builder) called **Creator**. The Creator is a visual, graph-based/canvas system to create, modify, configure, template, manage and engage with local langgraph systems.

## Key Components

### 1. Creator - AI Builder Mode
- Visual canvas for creating/modifying LangGraph graphs
- Connect with OAP template and config system (loads deployed graphs and templates them)
- Load existing graphs, modify, or create new ones
- View and inspect existing config panels for:
  - Agents
  - Tools
  - RAG
  - Prompts
  - Other configurable elements

### 2. Expanded Configurability
More control over LangGraph elements:
- Flows
- Edges
- Conditions
- Routers
- Handoff logic (if applicable)
- Variables
- Other graph elements

### 3. Intuitive Interface
- Drag and drop new templates and existing agents (using existing OAP systems)
- Drag and drop tools and premade elements
- Intuitive set of panels
- Click/select nodes and edges in visual canvas
- Side panels and popup action toolbars for interaction
- Comments system: attach comments to one or multiple nodes, edges, and other canvas elements

### 4. langgraph-builder Integration
Current state:
- Canvas with minimal demonstration visual graph creation
- Comments support
- Exports to LangGraph graph in correct format (blueprint creator)

Target integration:
- Merge into OAP
- Output to file that feeds into and triggers a langgraph graph
- Need corresponding OAP graph on the "other side" to receive the output

### 5. OAP Resources Available
- Graphs for:
  - Code editing/writing
  - Documentation
  - Research
- RAG tools and collections for:
  - LangGraph documentation
  - Other documentation

### 6. Creator - Deployments Mode
- Graph view of frontend and backend
- References into OAP for connected:
  - Graphs
  - Tools
  - Collections
  - All other resources
- User can drop in and save to all OAP resources
- Cross-connections between Creator modes and views using references
- Configurable connection system
- Load and manage configurations in Creator itself

### 7. Component-Based Frontend System
- Templated/configurable counterpart to OAP logic for frontend UI
- Maps to existing OAP frontend (already component-based)
- Clear rules and processes to be discovered

### 8. Bidirectional Flow Architecture

#### AI Builder Mode Flow:
Visual Canvas → Formatted Code Export → Agent Graph Process → Execution

#### Deployments Mode Flow:
Similar agent graph frontend ↔ backend flow
- Need corresponding version of langgraph-builder logic
- Exports agent graph from visual canvas to formatted code
- Corresponding agent graph process to receive
- Process request according to content and connected agent graph logic

### 9. First Deployment: Vi Builder
- Maps to real frontend
- Branded version of open-agent-platform
- Used to make new Deployments from templates

## Discovery Requirements

Need to understand:
1. How current OAP template/config system works
2. How langgraph-builder exports graphs
3. OAP frontend component architecture
4. Agent graph processing mechanisms
5. Resource reference systems
6. Configuration management patterns
7. Graph execution and triggering mechanisms
8. Frontend-backend communication patterns

## Success Criteria

- Visual canvas for intuitive LangGraph graph creation
- Seamless integration with OAP systems (agents, tools, RAG, prompts)
- Export to valid LangGraph code
- Agent graph processing of exported graphs
- Deployments mode for system architecture visualization
- Component-based, templatable UI system
- Bidirectional flows working in both modes
