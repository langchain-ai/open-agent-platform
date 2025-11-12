# Directory Structure Scan

## Open-Agent-Platform (OAP) Structure

### Root Level
```
.
├── AGENTS.md
├── CONCEPTS.md
├── OAP_ORCHESTRATOR_AGENT_DESIGN.md
├── OAP_ORCHESTRATOR_ARCHITECTURE.md
├── OLLAMA_TURBO_IMPLEMENTATION_GUIDE.md
├── QUICK_START_GUIDE.md
├── README.md
├── package.json
├── tsconfig.json
├── docker-compose.postgres.yml
└── setup_all_agents.py
```

### Apps Structure
```
apps/
├── docs/
│   ├── AGENTS.md
│   ├── CONCEPTS.md
│   ├── README.md
│   ├── package.json
│   └── [various documentation files]
└── web/                          # Main web application
    ├── AGENTS.md
    ├── CONCEPTS.md
    ├── README.md
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── app/                  # Next.js app directory
        ├── components/           # Shared components
        ├── features/             # Feature modules
        │   ├── agents/          # Agent management
        │   ├── chat/            # Chat interface
        │   ├── rag/             # RAG functionality
        │   ├── tools/           # Tool management
        │   ├── settings/        # Settings UI
        │   ├── signin/
        │   ├── signup/
        │   ├── inbox/
        │   ├── forgot-password/
        │   └── reset-password/
        ├── hooks/               # Custom React hooks
        ├── lib/                 # Utility libraries
        ├── providers/           # React context providers
        ├── types/               # TypeScript types
        ├── constants.ts
        └── middleware.ts
```

### Other Directories
```
vi-meta/                         # Empty directory
.venv/                           # Python virtual environment
```

## langgraph-builder Structure

### Root Level
```
.
├── README.md
├── package.json
├── tsconfig.json
└── venv/                        # Python virtual environment
```

### Source Structure
```
src/
├── components/                  # React components (canvas, nodes, etc.)
├── contexts/                    # React contexts (state management)
├── lib/                         # Utility libraries (export logic, etc.)
├── pages/                       # Next.js pages
└── styles/                      # CSS/styling
```

## Global Documentation Files

### OAP Global Files
1. `/README.md` - Main project README
2. `/AGENTS.md` - Agent system documentation
3. `/CONCEPTS.md` - Core concepts documentation
4. `/OAP_ORCHESTRATOR_AGENT_DESIGN.md` - Orchestrator design
5. `/OAP_ORCHESTRATOR_ARCHITECTURE.md` - Orchestrator architecture
6. `/OLLAMA_TURBO_IMPLEMENTATION_GUIDE.md` - Ollama integration guide
7. `/QUICK_START_GUIDE.md` - Quick start guide
8. `/apps/docs/README.md` - Documentation app README
9. `/apps/docs/AGENTS.md` - Docs-specific agent info
10. `/apps/docs/CONCEPTS.md` - Docs-specific concepts
11. `/apps/web/README.md` - Web app README
12. `/apps/web/AGENTS.md` - Web app agent info
13. `/apps/web/CONCEPTS.md` - Web app concepts

### langgraph-builder Global Files
1. `/README.md` - Main project README

## Key Observations

### OAP
- Monorepo structure with multiple apps
- Feature-based organization in web app
- Clear separation of concerns (agents, tools, RAG, chat)
- TypeScript + React (Next.js)
- Python backend components (setup_all_agents.py, .venv)
- Comprehensive documentation at multiple levels

### langgraph-builder
- Standard Next.js application structure
- Component-based architecture
- Context API for state management
- Simpler, more focused structure
- Likely client-side focused

## Integration Points to Investigate

1. **OAP Features** that Creator needs to integrate with:
   - `apps/web/src/features/agents/` - Agent management
   - `apps/web/src/features/tools/` - Tool management
   - `apps/web/src/features/rag/` - RAG functionality
   - `apps/web/src/features/chat/` - Chat interface

2. **OAP Infrastructure** to understand:
   - `apps/web/src/lib/` - Utility libraries
   - `apps/web/src/providers/` - State management
   - `apps/web/src/hooks/` - Custom hooks
   - `apps/web/src/types/` - Type definitions

3. **langgraph-builder Core** to integrate:
   - `src/components/` - Canvas and visual components
   - `src/contexts/` - State management for canvas
   - `src/lib/` - Export and processing logic
