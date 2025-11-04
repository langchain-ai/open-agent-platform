# Comprehensive SELF Questions for Creator Feature

## A. Open-Agent-Platform (OAP / Vi Builder) Understanding

### A1. Core Architecture
- [ ] What is the overall architecture of OAP?
- [ ] What does "Vi Builder" mean in relation to OAP?
- [ ] How is the codebase structured (monorepo, apps structure)?
- [ ] What are the main applications in the repo?
- [ ] What technology stack is used (React, Node, database, etc.)?

### A2. Template System
- [ ] What is the "template and config system" mentioned?
- [ ] How does OAP "load deployed graphs and template them"?
- [ ] Where are templates stored?
- [ ] What format are templates in?
- [ ] How are templates applied to graphs?
- [ ] What is configurable in a template?

### A3. Agent System
- [ ] What is an "agent" in OAP context?
- [ ] How are agents created and configured?
- [ ] Where is agent configuration stored?
- [ ] What properties/settings do agents have?
- [ ] How do agents relate to LangGraph graphs?
- [ ] What existing agent management UI exists?

### A4. Tools System
- [ ] What are "tools" in OAP?
- [ ] How are tools registered/discovered?
- [ ] Where are tool configurations stored?
- [ ] How do tools integrate with agents?
- [ ] What UI exists for tool management?
- [ ] Can tools be dragged and dropped currently?

### A5. RAG System
- [ ] What RAG functionality exists?
- [ ] What are "RAG collections"?
- [ ] How is RAG configured?
- [ ] What documentation collections exist (LangGraph, etc.)?
- [ ] How does RAG integrate with agents/graphs?

### A6. Prompts System
- [ ] How are prompts managed in OAP?
- [ ] Where are prompts stored?
- [ ] Are there prompt templates?
- [ ] How do prompts relate to agents?
- [ ] What prompt configuration UI exists?

### A7. Frontend Architecture
- [ ] What is the component structure of the frontend?
- [ ] What UI framework/library is used?
- [ ] What are the "clear rules and processes" mentioned?
- [ ] How are pages/routes organized?
- [ ] What state management is used?
- [ ] How does frontend communicate with backend?

### A8. Backend Architecture
- [ ] What backend framework is used?
- [ ] How are APIs structured?
- [ ] What database is used?
- [ ] How are graphs executed on the backend?
- [ ] What is the deployment model?

### A9. Graph System
- [ ] How does OAP execute LangGraph graphs?
- [ ] Where are graph definitions stored?
- [ ] How are graphs triggered/invoked?
- [ ] What is a "deployed graph"?
- [ ] How do graphs receive input?
- [ ] How do graphs return output?

### A10. Resource References
- [ ] What are "OAP resources"?
- [ ] How are resources referenced?
- [ ] What is the referencing system/format?
- [ ] How are cross-references maintained?
- [ ] Can resources reference each other?

## B. langgraph-builder Understanding

### B1. Core Functionality
- [ ] What is langgraph-builder?
- [ ] What does it currently do?
- [ ] What technology is it built with?
- [ ] How does it work internally?

### B2. Canvas System
- [ ] How is the canvas implemented?
- [ ] What library/framework is used for the canvas?
- [ ] How are nodes represented?
- [ ] How are edges represented?
- [ ] What interactions are supported?

### B3. Visual Graph Creation
- [ ] What does "minimal demonstration visual graph creation" mean?
- [ ] What graph elements can be created?
- [ ] How are graph elements added/removed?
- [ ] How are connections made?
- [ ] What properties can be configured?

### B4. Comments System
- [ ] How are comments implemented?
- [ ] Can comments attach to nodes/edges?
- [ ] How is comment data stored?
- [ ] What does the comment UI look like?
- [ ] Can multiple elements share comments?

### B5. Export Mechanism
- [ ] What format does it export to?
- [ ] Is it valid LangGraph Python code?
- [ ] Is it JSON/configuration?
- [ ] How is the export triggered?
- [ ] Where does the export go?

### B6. Blueprint Concept
- [ ] What does "blueprint creator" mean?
- [ ] Is it a visual design only, or executable?
- [ ] How does a blueprint become a running graph?

## C. LangGraph Framework Understanding

### C1. Core Concepts
- [ ] What are LangGraph's core primitives?
- [ ] What is a node in LangGraph?
- [ ] What is an edge in LangGraph?
- [ ] What is a StateGraph?
- [ ] What is a MessageGraph?

### C2. Advanced Features
- [ ] What are conditional edges?
- [ ] What are routers in LangGraph?
- [ ] What is handoff logic?
- [ ] How do subgraphs work?
- [ ] What are variables/state in LangGraph?

### C3. Configuration
- [ ] How are LangGraph graphs configured?
- [ ] What is configurable at runtime?
- [ ] How are tools added to graphs?
- [ ] How are models configured?

## D. Integration Questions

### D1. Code Export to Execution
- [ ] How will visual canvas export to LangGraph code?
- [ ] What agent graph will receive the exported code?
- [ ] How will the receiving graph process the code?
- [ ] Will it execute immediately or store for later?
- [ ] How will errors be handled?

### D2. OAP Integration Points
- [ ] How will Creator integrate with existing OAP UI?
- [ ] Will it be a new route/page?
- [ ] How will it access OAP's agent system?
- [ ] How will it access OAP's tool system?
- [ ] How will it access OAP's RAG system?
- [ ] How will it save/load from OAP storage?

### D3. Bidirectional Flow
- [ ] What does frontend ↔ backend flow mean here?
- [ ] How will visual changes trigger backend updates?
- [ ] How will backend state reflect in visual canvas?
- [ ] What is the synchronization mechanism?

### D4. Deployments Mode
- [ ] What is "Deployments Mode" exactly?
- [ ] How is it different from AI Builder Mode?
- [ ] What does "graph of frontend and backend" mean?
- [ ] How are references visualized?
- [ ] What can be configured in Deployments Mode?

## E. Feature Design Questions

### E1. Modes and Views
- [ ] What are the different "modes" in Creator?
- [ ] How does user switch between modes?
- [ ] What is persistent across modes?
- [ ] What is mode-specific?

### E2. Drag and Drop
- [ ] What elements can be dragged?
- [ ] Where can they be dropped?
- [ ] What happens on drop (create node, add reference, etc.)?
- [ ] How are templates dragged vs agents vs tools?

### E3. UI Interaction
- [ ] What happens when clicking a node?
- [ ] What happens when selecting an edge?
- [ ] What do side panels show?
- [ ] What do popup action toolbars show?
- [ ] How do comments attach to multiple elements?

### E4. Component System
- [ ] What does "component-based templated/configurable counterpart" mean?
- [ ] How will frontend components be templated?
- [ ] How does this map to existing OAP components?
- [ ] What becomes configurable that wasn't before?

### E5. Configuration Management
- [ ] What is configurable about the Creator itself?
- [ ] What is configurable about deployments?
- [ ] Where are Creator configurations stored?
- [ ] How are configurations loaded/saved?

## F. Implementation Strategy Questions

### F1. Technical Approach
- [ ] Merge langgraph-builder code or integrate as dependency?
- [ ] Modify langgraph-builder or wrap it?
- [ ] What parts of langgraph-builder are reusable as-is?
- [ ] What parts need to be rebuilt/adapted?

### F2. Data Flow
- [ ] Where is canvas state stored?
- [ ] How is canvas state persisted?
- [ ] How is canvas state synchronized with backend?
- [ ] What triggers graph execution?
- [ ] How are execution results returned?

### F3. Architecture
- [ ] Monolithic or modular approach?
- [ ] Client-side or server-side graph processing?
- [ ] Real-time updates or request-response?
- [ ] What APIs need to be created/modified?

## G. Success Criteria Questions

### G1. User Experience
- [ ] What does "intuitive" mean in this context?
- [ ] What workflows should be optimized?
- [ ] What pain points in current system are being solved?

### G2. Technical Requirements
- [ ] What performance requirements exist?
- [ ] What scale is expected (nodes per graph, etc.)?
- [ ] What browsers need to be supported?
- [ ] What are the data persistence requirements?

### G3. Integration Success
- [ ] How will we know OAP integration is successful?
- [ ] What existing functionality must not break?
- [ ] What testing is required?

## H. Terminology and Glossary

### H1. Project-Specific Terms
- [ ] What is "Vi Builder" vs "OAP" vs "open-agent-platform"?
- [ ] What is "Creator" vs "AI Builder Mode" vs "Deployments Mode"?
- [ ] What is a "deployment" in this context?
- [ ] What are "OAP resources"?

### H2. Domain Terms
- [ ] What is meant by "graph" in different contexts?
- [ ] What is a "template" vs "config" vs "blueprint"?
- [ ] What is "handoff logic"?
- [ ] What is a "premade element"?

## Question Priority

### Critical (Must Answer First)
- A1, A2, A3, A7, A9
- B1, B2, B5
- D2, D4
- H1

### High Priority
- A4, A5, A6, A8, A10
- B3, B4
- C1, C2
- D1, D3
- F1, F2

### Medium Priority
- B6
- C3
- E1, E2, E3
- F3
- G1

### Lower Priority (Can be determined during implementation)
- E4, E5
- G2, G3
- H2
