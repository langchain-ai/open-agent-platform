# Explorer Agent Allocation

## Agent Assignment Strategy

Each Explorer agent is assigned a specific scope to investigate. Their goals are:
1. Answer relevant SELF questions from their domain
2. Map the structure, patterns, and key concepts in their area
3. Document integration points and dependencies
4. Identify reusable patterns and components

## Agent 1: OAP Architecture & Documentation Scout
**Scope:** Root-level documentation and architecture
**Thoroughness:** Very thorough

**Files to investigate:**
- `/README.md`
- `/AGENTS.md`
- `/CONCEPTS.md`
- `/OAP_ORCHESTRATOR_AGENT_DESIGN.md`
- `/OAP_ORCHESTRATOR_ARCHITECTURE.md`
- `/QUICK_START_GUIDE.md`
- `/apps/web/README.md`
- `/apps/web/AGENTS.md`
- `/apps/web/CONCEPTS.md`

**Questions to answer:**
- What is OAP's overall architecture?
- What is "Vi Builder" in relation to OAP?
- How does the orchestrator work?
- What are the core concepts and design patterns?
- What is the technology stack?

## Agent 2: OAP Agents Feature Explorer
**Scope:** Agent management system
**Thoroughness:** Very thorough

**Directory:** `apps/web/src/features/agents/`

**Questions to answer:**
- What is an "agent" in OAP?
- How are agents created and configured?
- Where is agent configuration stored?
- What properties/settings do agents have?
- How do agents relate to LangGraph graphs?
- What UI exists for agent management?
- How does the agent form/dialog work?

## Agent 3: OAP Tools & MCP Explorer
**Scope:** Tool management system
**Thoroughness:** Very thorough

**Directories:**
- `apps/web/src/features/tools/`
- `apps/web/src/hooks/use-mcp.tsx`
- `apps/web/src/types/tool.ts`

**Questions to answer:**
- What are "tools" in OAP?
- How are tools registered/discovered?
- Where are tool configurations stored?
- How do tools integrate with agents?
- What UI exists for tool management?
- What is MCP and how does it relate to tools?

## Agent 4: OAP RAG System Explorer
**Scope:** RAG functionality and collections
**Thoroughness:** Very thorough

**Directory:** `apps/web/src/features/rag/`

**Questions to answer:**
- What RAG functionality exists?
- What are "RAG collections"?
- How is RAG configured?
- What documentation collections exist?
- How does RAG integrate with agents/graphs?
- What UI exists for RAG management?

## Agent 5: OAP Chat & Streaming Explorer
**Scope:** Chat interface and execution
**Thoroughness:** Very thorough

**Directories:**
- `apps/web/src/features/chat/`
- `apps/web/src/features/chat/providers/Stream.tsx`

**Questions to answer:**
- How does the chat interface work?
- How are graphs executed?
- What is the streaming mechanism?
- How does chat connect to agents/graphs?
- What is the message flow?

## Agent 6: OAP Core Infrastructure Explorer
**Scope:** Core libraries, providers, hooks, and types
**Thoroughness:** Very thorough

**Directories:**
- `apps/web/src/lib/`
- `apps/web/src/providers/`
- `apps/web/src/hooks/`
- `apps/web/src/types/`
- `apps/web/src/components/` (shared)

**Questions to answer:**
- What utilities and libraries exist?
- What state management patterns are used?
- What custom hooks are available?
- What are the core TypeScript types?
- What shared components exist?
- How does frontend-backend communication work?

## Agent 7: langgraph-builder Canvas & Components Explorer
**Scope:** Visual canvas and component system
**Thoroughness:** Very thorough

**Directories:**
- `langgraph-builder/src/components/`
- `langgraph-builder/src/styles/`
- `langgraph-builder/src/pages/`

**Questions to answer:**
- How is the canvas implemented?
- What library/framework is used?
- How are nodes/edges represented?
- What interactions are supported?
- How does the comment system work?
- What components are reusable?

## Agent 8: langgraph-builder State & Export Explorer
**Scope:** State management and export logic
**Thoroughness:** Very thorough

**Directories:**
- `langgraph-builder/src/contexts/`
- `langgraph-builder/src/lib/`
- `langgraph-builder/README.md`

**Questions to answer:**
- How is canvas state managed?
- What does the export mechanism do?
- What format is exported?
- How does the state flow work?
- What utility functions exist?
- What is the "blueprint" concept?

## Cross-Agent Coordination

All agents should note:
1. **Integration points** - where their area connects to others
2. **Dependencies** - what their area depends on
3. **Patterns** - reusable patterns they discover
4. **Challenges** - potential integration challenges
5. **Opportunities** - ways to leverage existing functionality

## Output Format

Each agent should produce:
1. **Domain Map** - Structure and key files
2. **Answers** - Responses to assigned questions
3. **Patterns** - Key patterns and conventions
4. **Integration Points** - How this connects to other areas
5. **Glossary Entries** - Key terms and concepts
