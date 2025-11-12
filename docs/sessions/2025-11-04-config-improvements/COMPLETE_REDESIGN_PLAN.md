# Complete Configuration Redesign Implementation Plan

## Scope

Complete redesign of Research Agent configuration from flat 44-field structure to proper 3-agent hierarchy (Orchestrator + Research Sub-Agent + Critique Sub-Agent) with full template support.

**Estimated Changes:**
- Backend: ~1500 lines modified/added
- Frontend: ~800 lines modified/added
- New files: ~5

## Critical Requirements

1. **Zero Breaking Changes**: Existing configs must continue working
2. **Backward Compatibility**: Old field names mapped to new structure
3. **Template System**: Preset configurations for common use cases
4. **Per-Agent Control**: Each of 3 agents gets own config section
5. **Tool Distribution**: Proper per-agent tool allocation
6. **Prompt Customization**: Make all prompts configurable

## Implementation Order

### STEP 1: Backend Schema Addition (No Deletions)
**File**: `deepagents-platform/src/agent/graph.py`

Add new fields alongside existing ones:

```python
# NEW GROUP 1: DEPLOYMENT OVERVIEW
template_preset: Optional[str] = Field(default=None, ...)
deployment_type: Optional[str] = Field(default="research-agent", ...)

# NEW GROUP 2: ORCHESTRATOR AGENT
orchestrator_model: Optional[str] = Field(default=None, ...)  # None = use model_name
orchestrator_temperature: Optional[float] = Field(default=None, ...)  # None = use temperature
orchestrator_max_tokens: Optional[int] = Field(default=None, ...)
orchestrator_recursion_limit: Optional[int] = Field(default=None, ...)
orchestrator_prompt: Optional[str] = Field(default=None, ...)
orchestrator_mcp_tools: Optional[List[str]] = Field(default_factory=list, ...)
orchestrator_rag_collections: Optional[List[str]] = Field(default_factory=list, ...)
orchestrator_builtin_tools: Optional[List[str]] = Field(
    default_factory=lambda: ["write_todos", "write_file", "read_file", "ls", "edit_file"],
    ...
)
orchestrator_enable_internet_search: Optional[bool] = Field(default=False, ...)
orchestrator_extended_thinking: Optional[bool] = Field(default=None, ...)
orchestrator_thinking_budget: Optional[int] = Field(default=None, ...)
orchestrator_prompt_caching: Optional[bool] = Field(default=None, ...)

# NEW GROUP 3: RESEARCH SUB-AGENT
research_enabled: Optional[bool] = Field(default=True, ...)
research_model: Optional[str] = Field(default="inherit", ...)
research_temperature: Optional[float] = Field(default=None, ...)
research_max_tokens: Optional[int] = Field(default=None, ...)
research_prompt: Optional[str] = Field(default=None, ...)  # Was hardcoded!
research_mcp_tools: Optional[List[str]] = Field(default_factory=list, ...)
research_rag_collections: Optional[List[str]] = Field(default_factory=list, ...)
research_builtin_tools: Optional[List[str]] = Field(
    default_factory=lambda: ["write_file", "read_file", "edit_file"],
    ...
)
research_enable_internet_search: Optional[bool] = Field(default=True, ...)
# Keep existing: research_depth, max_search_results, search_topic_type, include_raw_content

# NEW GROUP 4: CRITIQUE SUB-AGENT
critique_enabled: Optional[bool] = Field(default=None, ...)  # None = use enable_critique
critique_model: Optional[str] = Field(default="inherit", ...)
critique_temperature: Optional[float] = Field(default=None, ...)
critique_max_tokens: Optional[int] = Field(default=None, ...)
critique_prompt: Optional[str] = Field(default=None, ...)  # Was hardcoded!
critique_mcp_tools: Optional[List[str]] = Field(default_factory=list, ...)
critique_rag_collections: Optional[List[str]] = Field(default_factory=list, ...)
critique_builtin_tools: Optional[List[str]] = Field(
    default_factory=lambda: ["read_file"],
    ...
)
critique_enable_internet_search: Optional[bool] = Field(default=True, ...)
# Keep existing: critique_focus

# NEW: Built-in tool control
enable_builtin_todos: Optional[bool] = Field(default=True, ...)
enable_builtin_files: Optional[bool] = Field(default=True, ...)

# NEW: Search provider control
internet_search_provider: Optional[str] = Field(default="tavily", ...)
tavily_api_key_override: Optional[str] = Field(default=None, ...)

# NEW: Global tool inheritance
global_mcp_tools: Optional[List[str]] = Field(default_factory=list, ...)
global_rag_collections: Optional[List[str]] = Field(default_factory=list, ...)
```

**Keep ALL existing fields for backward compatibility!**

### STEP 2: Migration & Inheritance Logic
**File**: `deepagents-platform/src/agent/graph.py` (add functions)

```python
def resolve_orchestrator_config(cfg: GraphConfigPydantic) -> dict:
    """Resolve orchestrator configuration with fallbacks to old fields"""
    return {
        "model": cfg.orchestrator_model or cfg.model_name or DEFAULT_MODEL,
        "temperature": cfg.orchestrator_temperature if cfg.orchestrator_temperature is not None else cfg.temperature,
        "max_tokens": cfg.orchestrator_max_tokens or cfg.max_tokens,
        "recursion_limit": cfg.orchestrator_recursion_limit or cfg.max_recursion_limit,
        "prompt": cfg.orchestrator_prompt or research_instructions,  # Default if not set
        "mcp_tools": cfg.orchestrator_mcp_tools or [],
        "rag_collections": cfg.orchestrator_rag_collections or [],
        "builtin_tools": cfg.orchestrator_builtin_tools,
        "enable_search": cfg.orchestrator_enable_internet_search,
        "extended_thinking": cfg.orchestrator_extended_thinking if cfg.orchestrator_extended_thinking is not None else cfg.enable_extended_thinking,
        "thinking_budget": cfg.orchestrator_thinking_budget or cfg.thinking_budget_tokens,
        "prompt_caching": cfg.orchestrator_prompt_caching if cfg.orchestrator_prompt_caching is not None else cfg.enable_prompt_caching,
    }

def resolve_research_config(cfg: GraphConfigPydantic, orchestrator_config: dict) -> dict:
    """Resolve research sub-agent config with inheritance"""
    return {
        "enabled": cfg.research_enabled if cfg.research_enabled is not None else True,
        "model": cfg.research_model if cfg.research_model != "inherit" else orchestrator_config["model"],
        "temperature": cfg.research_temperature if cfg.research_temperature is not None else orchestrator_config["temperature"],
        "max_tokens": cfg.research_max_tokens or orchestrator_config["max_tokens"],
        "prompt": cfg.research_prompt or sub_research_prompt,  # Use new field or default
        "mcp_tools": cfg.research_mcp_tools or [],
        "rag_collections": cfg.research_rag_collections or [],
        "builtin_tools": cfg.research_builtin_tools,
        "enable_search": cfg.research_enable_internet_search,
        # Research-specific
        "depth": cfg.research_depth,
        "max_search_results": cfg.max_search_results,
        "search_topic": cfg.search_topic_type,
        "include_raw_content": cfg.include_raw_content,
    }

def resolve_critique_config(cfg: GraphConfigPydantic, orchestrator_config: dict) -> dict:
    """Resolve critique sub-agent config with inheritance"""
    return {
        "enabled": cfg.critique_enabled if cfg.critique_enabled is not None else cfg.enable_critique,
        "model": cfg.critique_model if cfg.critique_model != "inherit" else orchestrator_config["model"],
        "temperature": cfg.critique_temperature if cfg.critique_temperature is not None else orchestrator_config["temperature"],
        "max_tokens": cfg.critique_max_tokens or orchestrator_config["max_tokens"],
        "prompt": cfg.critique_prompt or sub_critique_prompt,  # Use new field or default
        "mcp_tools": cfg.critique_mcp_tools or [],
        "rag_collections": cfg.critique_rag_collections or [],
        "builtin_tools": cfg.critique_builtin_tools,
        "enable_search": cfg.critique_enable_internet_search,
        # Critique-specific
        "focus": cfg.critique_focus,
    }

def merge_tool_allocations(cfg: GraphConfigPydantic, orchestrator_config: dict, research_config: dict, critique_config: dict) -> dict:
    """Merge old mcp_config fields with new per-agent fields"""
    # OLD SYSTEM: mcp_config_graph + mcp_config - exclusions
    old_graph_tools = cfg.mcp_config_graph.tools if cfg.mcp_config_graph else []
    old_agent_tools = cfg.mcp_config.tools if cfg.mcp_config else []
    old_exclusions = cfg.mcp_config_exclusions or []

    # NEW SYSTEM: global + per-agent
    global_tools = cfg.global_mcp_tools or []

    # MIGRATION: If using old system, migrate to new
    if old_graph_tools or old_agent_tools:
        # Old "graph" → global
        # Old "agent" → orchestrator (since orchestrator coordinates)
        effective_global = list(set(old_graph_tools + global_tools))
        effective_orchestrator = list(set(old_agent_tools + orchestrator_config["mcp_tools"]))
        effective_exclusions = old_exclusions
    else:
        # Pure new system
        effective_global = global_tools
        effective_orchestrator = orchestrator_config["mcp_tools"]
        effective_exclusions = []

    return {
        "global": effective_global,
        "orchestrator": effective_orchestrator,
        "research": research_config["mcp_tools"],
        "critique": critique_config["mcp_tools"],
        "exclusions": effective_exclusions,
    }
```

### STEP 3: Template Preset System
**File**: `deepagents-platform/src/agent/templates.py` (NEW)

```python
"""Template presets for Research Agent configurations"""

from typing import Dict, Any

TEMPLATES: Dict[str, Dict[str, Any]] = {
    "quick": {
        "name": "Quick Research",
        "description": "Fast research for simple queries (~5 min)",
        "config": {
            # Orchestrator
            "orchestrator_model": "anthropic:claude-sonnet-4",
            "orchestrator_temperature": 0.7,
            "orchestrator_max_tokens": 4000,

            # Research sub-agent
            "research_model": "openai:gpt-4o-mini",  # Faster/cheaper
            "research_depth": "quick",
            "research_max_search_results": 5,

            # Critique disabled for speed
            "critique_enabled": False,

            # Output
            "output_format": "concise",
        }
    },

    "academic": {
        "name": "Academic Research",
        "description": "Thorough research with quality validation (~30 min)",
        "config": {
            # Orchestrator
            "orchestrator_model": "anthropic:claude-sonnet-4-5-20250929",
            "orchestrator_temperature": 0.5,
            "orchestrator_max_tokens": 8000,
            "orchestrator_extended_thinking": True,
            "orchestrator_thinking_budget": 20000,

            # Research sub-agent
            "research_model": "anthropic:claude-sonnet-4-5-20250929",
            "research_depth": "exhaustive",
            "research_max_search_results": 20,
            "research_include_raw_content": True,

            # Critique with high-quality model
            "critique_enabled": True,
            "critique_model": "anthropic:claude-opus-4-20250514",
            "critique_focus": "all",

            # Output
            "output_format": "comprehensive",
            "output_include_citations": True,
        }
    },

    "news": {
        "name": "News Analysis",
        "description": "Current events research (~15 min)",
        "config": {
            "orchestrator_model": "openai:gpt-4-turbo",
            "research_model": "openai:gpt-4-turbo",
            "research_depth": "comprehensive",
            "research_search_topic_type": "news",
            "research_max_search_results": 15,
            "critique_enabled": False,  # Speed over validation
            "output_format": "detailed",
        }
    },

    "financial": {
        "name": "Financial Research",
        "description": "Market and financial analysis (~20 min)",
        "config": {
            "orchestrator_model": "anthropic:claude-sonnet-4-5-20250929",
            "research_model": "anthropic:claude-sonnet-4-5-20250929",
            "research_depth": "comprehensive",
            "research_search_topic_type": "finance",
            "research_max_search_results": 12,
            "research_include_raw_content": True,
            "critique_enabled": True,
            "critique_focus": "accuracy",  # Focus on factual accuracy
            "output_format": "comprehensive",
            "output_include_citations": True,
        }
    },
}

def load_template(template_name: str) -> Dict[str, Any]:
    """Load a template preset configuration"""
    if template_name not in TEMPLATES:
        raise ValueError(f"Unknown template: {template_name}. Available: {list(TEMPLATES.keys())}")
    return TEMPLATES[template_name]["config"]

def apply_template(base_config: Dict[str, Any], template_name: str) -> Dict[str, Any]:
    """Apply template to base configuration, preserving user overrides"""
    template_config = load_template(template_name)

    # Template values only apply if user hasn't set them
    result = template_config.copy()
    for key, value in base_config.items():
        if value is not None:  # User explicitly set this
            result[key] = value

    return result
```

### STEP 4: Update research_agent_node Implementation
**File**: `deepagents-platform/src/agent/graph.py` (modify research_agent_node function)

Key changes in the node function:

```python
async def research_agent_node(state: State, config: RunnableConfig):
    # ... existing setup ...

    cfg = GraphConfigPydantic(**config.get("configurable", {}))

    # APPLY TEMPLATE IF SET
    if cfg.template_preset:
        from agent.templates import apply_template
        template_config = apply_template(cfg.dict(), cfg.template_preset)
        cfg = GraphConfigPydantic(**template_config)

    # RESOLVE CONFIGURATIONS
    orchestrator_config = resolve_orchestrator_config(cfg)
    research_config = resolve_research_config(cfg, orchestrator_config)
    critique_config = resolve_critique_config(cfg, orchestrator_config)
    tool_allocation = merge_tool_allocations(cfg, orchestrator_config, research_config, critique_config)

    # BUILD TOOL LISTS PER AGENT
    orchestrator_tools = await build_tool_list(
        orchestrator_config["mcp_tools"],
        orchestrator_config["rag_collections"],
        orchestrator_config["builtin_tools"],
        orchestrator_config["enable_search"],
        config
    )

    research_tools = await build_tool_list(
        research_config["mcp_tools"],
        research_config["rag_collections"],
        research_config["builtin_tools"],
        research_config["enable_search"],
        config
    )

    critique_tools = await build_tool_list(
        critique_config["mcp_tools"],
        critique_config["rag_collections"],
        critique_config["builtin_tools"],
        critique_config["enable_search"],
        config
    )

    # BUILD SUB-AGENT CONFIGS (with proper tool allocation!)
    configured_subagents = []

    if research_config["enabled"]:
        research_sub_agent = {
            "name": "research-agent",
            "description": "Used to research more in depth questions...",
            "prompt": research_config["prompt"],  # CUSTOMIZABLE NOW!
            "tools": [t.name for t in research_tools],  # PROPER ALLOCATION!
            "model": research_config["model"],  # Can differ from orchestrator
        }
        configured_subagents.append(research_sub_agent)

    if critique_config["enabled"]:
        critique_sub_agent = {
            "name": "critique-agent",
            "description": "Used to critique the final report...",
            "prompt": critique_config["prompt"],  # CUSTOMIZABLE NOW!
            "tools": [t.name for t in critique_tools],  # PROPER ALLOCATION!
            "model": critique_config["model"],  # Can differ from orchestrator
        }
        configured_subagents.append(critique_sub_agent)

    # CREATE AGENT WITH PROPER CONFIGURATION
    agent = create_deep_agent(
        orchestrator_tools,  # Orchestrator gets its specific tools
        orchestrator_config["prompt"],  # Orchestrator uses its prompt
        model=orchestrator_config["model"],
        subagents=configured_subagents,  # Sub-agents with their own configs
        builtin_tools=orchestrator_config["builtin_tools"],  # Control built-ins
    ).with_config({"recursion_limit": orchestrator_config["recursion_limit"]})

    # ... rest of execution ...
```

### STEP 5: Frontend Type Updates
**File**: `open-agent-platform/apps/web/src/types/configurable.ts`

Add new field names to types, keep old ones for compatibility.

### STEP 6: Frontend Config Sidebar Restructure
**File**: `open-agent-platform/apps/web/src/features/chat/components/configuration-sidebar/index.tsx`

Major restructure:

1. Add template preset dropdown at top
2. Group fields by agent (Orchestrator / Research / Critique)
3. Show inheritance badges ("Inherits from Orchestrator")
4. Collapsible agent sections

### STEP 7: Tools Tab Restructure
**File**: Same as STEP 6

Three sections instead of two:
- Orchestrator Tools
- Research Sub-Agent Tools
- Critique Sub-Agent Tools

## Testing Checklist

- [ ] Old configs still load and work
- [ ] Template presets apply correctly
- [ ] Per-agent tool distribution works
- [ ] Customized prompts are used
- [ ] Inheritance model works (inherit vs override)
- [ ] Frontend shows proper grouping
- [ ] Tools tab shows 3 agent sections
- [ ] Migration logic preserves user settings
- [ ] Build completes without errors
- [ ] End-to-end research workflow works

## Risk Mitigation

1. **Backup created**: ✅ Done
2. **Incremental changes**: Add new, keep old
3. **Feature flags**: Could add `use_new_schema` boolean
4. **Rollback plan**: Restore from backup
5. **Testing**: Test each component before moving to next

## Estimated Timeline

If doing all at once:
- Backend schema + logic: 3-4 hours
- Frontend restructure: 2-3 hours
- Testing + bug fixes: 2 hours
- **Total: 7-9 hours**

## Ready to Execute?

This is the complete plan. Should I proceed with full implementation now?
