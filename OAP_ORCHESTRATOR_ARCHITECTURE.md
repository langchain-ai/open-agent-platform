# OAP Orchestrator Agent - Technical Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION LAYER                             │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         Vi Chat UI (Port 3003)                        │ │
│  │                                                                       │ │
│  │  User: "Create a code generation agent with filesystem tools"       │ │
│  │                                                                       │ │
│  │  [Agent Dropdown]  ▼ OAP Orchestrator                               │ │
│  │  [Chat Input]                                                        │ │
│  │  [Confirmation Dialog] (optional)                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS + Supabase JWT
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OAP ORCHESTRATOR AGENT                               │
│                            (Port 2029)                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LangGraph Graph: oap_orchestrator                │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐         ┌─────────────────┐                  │   │
│  │  │  Orchestrator   │         │   Coordination  │                  │   │
│  │  │     Model       │────────▶│      Tools      │                  │   │
│  │  │  (Claude/GPT)   │         │   (12 tools)    │                  │   │
│  │  └─────────────────┘         └─────────────────┘                  │   │
│  │           │                            │                           │   │
│  │           │                            ▼                           │   │
│  │           │                   ┌─────────────────┐                  │   │
│  │           │                   │ Agent Mgmt:     │                  │   │
│  │           │                   │ - create_agent  │                  │   │
│  │           │                   │ - update_agent  │                  │   │
│  │           │                   │ - delete_agent  │                  │   │
│  │           │                   │ - list_agents   │                  │   │
│  │           │                   └─────────────────┘                  │   │
│  │           │                   ┌─────────────────┐                  │   │
│  │           │                   │ Discovery:      │                  │   │
│  │           │                   │ - list_deploys  │                  │   │
│  │           │                   │ - list_graphs   │                  │   │
│  │           │                   │ - get_schema    │                  │   │
│  │           │                   └─────────────────┘                  │   │
│  │           │                   ┌─────────────────┐                  │   │
│  │           │                   │ Validation:     │                  │   │
│  │           │                   │ - validate      │                  │   │
│  │           │                   │ - suggest       │                  │   │
│  │           │                   └─────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Supabase Auth Handler                          │   │
│  │   - Validates JWT tokens                                            │   │
│  │   - Extracts user_id                                                │   │
│  │   - Enforces multi-tenancy                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ LangGraph SDK Client
                                    │ (with user auth tokens)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TARGET LANGGRAPH DEPLOYMENTS                           │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  Tools Agent         │  │  Supervisor          │  │  Deep Research   │ │
│  │  (Port 2024)         │  │  (Port 2025)         │  │  (Port 2026)     │ │
│  │                      │  │                      │  │                  │ │
│  │  Graphs:             │  │  Graphs:             │  │  Graphs:         │ │
│  │  - agent             │  │  - multi_agent_*     │  │  - deep_research │ │
│  │                      │  │                      │  │                  │ │
│  │  LangGraph Platform  │  │  LangGraph Platform  │  │  LangGraph Platf │ │
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌─────────────┐ │
│  │  │ Assistants DB  │  │  │  │ Assistants DB  │  │  │  │Assistants DB│ │
│  │  │ (managed)      │  │  │  │ (managed)      │  │  │  │(managed)    │ │
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └─────────────┘ │
│  │                      │  │                      │  │                  │ │
│  │  SDK Operations:     │  │  SDK Operations:     │  │  SDK Operations: │ │
│  │  ✅ assistants.create│  │  ✅ assistants.create│  │  ✅ assistants.*│ │
│  │  ✅ assistants.update│  │  ✅ assistants.update│  │  ✅ threads.*   │ │
│  │  ✅ assistants.delete│  │  ✅ assistants.delete│  │  ✅ runs.*      │ │
│  │  ✅ assistants.search│  │  ✅ assistants.search│  │                  │ │
│  │  ✅ assistants.get   │  │  ✅ assistants.get   │  │                  │ │
│  │  ✅ getSchemas       │  │  ✅ getSchemas       │  │                  │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Shared Store Access
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POSTGRESQL STORE                                   │
│                                                                             │
│  Namespaces:                                                                │
│  - (user_id, "orchestrator", "audit")  → Operation logs                    │
│  - (user_id, "orchestrator", "cache")  → Cached deployment info            │
│  - (user_id, "execution_log")          → Sub-agent execution logs          │
│  - (user_id, "workspace")              → Shared agent workspace            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Create Agent Operation

```
┌─────────────┐
│   User      │
│  (Vi Chat)  │
└──────┬──────┘
       │
       │ 1. "Create a code generation agent"
       │
       ▼
┌─────────────────────────────────┐
│  OAP Orchestrator Agent         │
│  (oap_orchestrator graph)       │
│                                 │
│  ┌──────────────────────────┐   │
│  │ LLM receives user message│   │
│  │ Plans: Need to create    │   │
│  │ agent with code tools    │   │
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 2. Tool Call: list_deployments_tool()
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ Query available deploys  │   │
│  │ Returns: Tools (2024),   │   │
│  │ Supervisor (2025), etc.  │   │
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 3. Tool Call: list_graphs_tool(deployment_id="tools")
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ Fetch graphs on Tools    │◀──┼─── HTTP GET /info
│  │ deployment               │   │    (to port 2024)
│  │ Returns: ["agent"]       │   │
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 4. Tool Call: get_agent_config_schema_tool(graph="agent")
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ Fetch config schema      │◀──┼─── LangGraph SDK:
│  │ Returns: Pydantic model  │   │    client.assistants.getSchemas()
│  │ with field definitions   │   │
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 5. LLM analyzes schema
│             │    Builds config: {model, tools, prompt, temp}
│             │
│             │ 6. Tool Call: validate_agent_config_tool(config={...})
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ Validate configuration   │   │
│  │ Check: model valid,      │   │
│  │ tools exist, temp range  │   │
│  │ Returns: ✅ Valid        │   │
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 7. LLM formats confirmation
│             │    Asks user: "Create with these settings?"
│             ▼                   │
└─────────────┼───────────────────┘
              │
              │ Shows user confirmation
              ▼
       ┌──────────────┐
       │  User: "yes" │
       └──────┬───────┘
              │
              │ 8. User confirms
              ▼
┌─────────────────────────────────┐
│  OAP Orchestrator Agent         │
│                                 │
│             │ 9. Tool Call: create_agent_tool(name="Code Gen", config={...})
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ Create LangGraph Client  │   │
│  │ with user auth token     │   │
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 10. LangGraph SDK Call
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ client.assistants.create │◀──┼─── POST to Tools deployment (2024)
│  │ (graph, name, config)    │   │    /assistants
│  │                          │   │    Authorization: Bearer {token}
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 11. Success response with agent_id
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ Log to audit store       │───┼─── Store: (user_id, "orchestrator", "audit")
│  │ operation="create_agent" │   │    Key: op_{timestamp}
│  │ agent_id="asst_xyz"      │   │
│  └──────────┬───────────────┘   │
│             │                   │
│             │ 12. Format success message
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ "✅ Created Code Gen!    │   │
│  │  ID: asst_xyz            │   │
│  │  Ready to use!"          │   │
│  └──────────┬───────────────┘   │
└─────────────┼───────────────────┘
              │
              │ 13. Stream response to user
              ▼
       ┌──────────────┐
       │   User sees  │
       │  confirmation│
       └──────────────┘
```

---

## Component Interaction Matrix

| Component | Interacts With | Purpose | Protocol |
|-----------|----------------|---------|----------|
| Vi Chat UI | Orchestrator Agent | User interface | HTTPS + JWT |
| Orchestrator Agent | Tools Deployment | Create/manage agents | LangGraph SDK |
| Orchestrator Agent | Supervisor Deployment | Create/manage supervisors | LangGraph SDK |
| Orchestrator Agent | All Deployments | Discovery (graphs, schemas) | LangGraph SDK |
| Orchestrator Agent | PostgreSQL Store | Audit logs, caching | Store API |
| Orchestrator Tools | LangGraph SDK Client | CRUD operations | Python SDK |
| Auth Handler | Supabase | Validate JWT tokens | HTTP API |
| All Agents | PostgreSQL Store | Shared state | Store API |

---

## Configuration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AGENT CONFIGURATION LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────────────┘

1. GRAPH DEFINITION (Python Code)
   ════════════════════════════════

   File: oap-langgraph-tools-agent/oap_tools_agent/agent.py

   class GraphConfigPydantic(BaseModel):
       model_name: str = Field(
           default="anthropic:claude-sonnet-4-5-20250929",
           metadata={
               "x_oap_ui_config": {
                   "type": "select",
                   "options": get_all_models(),
               }
           },
       )
       tools: List[str] = Field(
           default=[],
           metadata={"x_oap_ui_config": {"type": "mcp"}},
       )

   ↓

2. SCHEMA EXPOSURE (LangGraph Platform)
   ═════════════════════════════════════

   LangGraph Platform reads GraphConfigPydantic and exposes via API:

   GET /assistants/{assistant_id}/schemas

   Returns:
   {
     "config_schema": {
       "type": "object",
       "properties": {
         "model_name": {
           "type": "string",
           "default": "anthropic:claude-sonnet-4-5-20250929",
           "x_oap_ui_config": {...}
         },
         "tools": {
           "type": "array",
           "items": {"type": "string"},
           "x_oap_ui_config": {"type": "mcp"}
         }
       }
     }
   }

   ↓

3. ORCHESTRATOR QUERIES SCHEMA
   ════════════════════════════════

   Tool: get_agent_config_schema_tool()

   client.assistants.getSchemas(system_assistant_id)
   → Returns Pydantic model definition
   → Orchestrator LLM understands required fields

   ↓

4. ORCHESTRATOR BUILDS CONFIG
   ═══════════════════════════════

   Based on schema + user intent:

   config = {
       "model_name": "anthropic:claude-sonnet-4-5-20250929",
       "tools": ["filesystem", "bash"],
       "temperature": 0.7,
       "system_prompt": "You are a code generation expert..."
   }

   ↓

5. ORCHESTRATOR CREATES AGENT
   ════════════════════════════════

   Tool: create_agent_tool()

   client.assistants.create(
       graphId="agent",
       name="Code Generator",
       config={"configurable": config}
   )

   ↓

6. AGENT STORED IN LANGGRAPH PLATFORM
   ════════════════════════════════════

   Assistant object:
   {
     "assistant_id": "asst_xyz",
     "graph_id": "agent",
     "name": "Code Generator",
     "config": {
       "configurable": {
         "model_name": "anthropic:claude-sonnet-4-5-20250929",
         "tools": ["filesystem", "bash"],
         "temperature": 0.7,
         "system_prompt": "..."
       }
     },
     "metadata": {
       "description": "Python code generation specialist"
     },
     "user_id": "user-123"  ← Set by auth handler
   }

   ↓

7. RUNTIME CONFIGURATION ACCESS
   ════════════════════════════════

   When agent is invoked:

   async def graph(config: RunnableConfig):
       cfg = GraphConfigPydantic(**config.get("configurable", {}))
       # cfg.model_name = "anthropic:claude-sonnet-4-5-20250929"
       # cfg.tools = ["filesystem", "bash"]
       # cfg.temperature = 0.7

       model = init_chat_model(cfg.model_name, temperature=cfg.temperature)
       tools = get_tools(cfg.tools)

       return create_agent_graph(model, tools, cfg.system_prompt)
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                  │
└─────────────────────────────────────────────────────────────────────────┘

Layer 1: AUTHENTICATION
═══════════════════════
┌──────────────┐
│  User Login  │
│  (Supabase)  │
└──────┬───────┘
       │
       │ Issues JWT token
       │ Claims: {user_id, email, exp, ...}
       ▼
┌──────────────────┐
│  JWT Token       │ ← Sent with every request
│  Bearer {token}  │   in Authorization header
└──────┬───────────┘
       │
       │ Validated by auth handler
       ▼

Layer 2: AUTHORIZATION
══════════════════════
┌────────────────────────────────┐
│  Supabase Auth Handler         │
│  (oap_orchestrator/security/)  │
│                                │
│  1. Verify JWT signature       │
│  2. Check expiration           │
│  3. Extract user_id            │
│  4. Inject into config         │
└────────┬───────────────────────┘
         │
         │ config["configurable"]["user_id"] = "user-123"
         ▼

Layer 3: OPERATION SCOPING
═══════════════════════════
┌────────────────────────────────┐
│  Tool Execution                │
│                                │
│  create_agent_tool():          │
│    user_id = get_user_from_config()
│    token = get_token_from_config()
│                                │
│    client = Client(            │
│      headers={                 │
│        "Authorization": token, │
│        "x-supabase-access-token": token
│      }                         │
│    )                           │
│                                │
│  → LangGraph Platform enforces │
│    user can only access their  │
│    own assistants              │
└────────┬───────────────────────┘
         │
         ▼

Layer 4: DATA ISOLATION
═══════════════════════
┌────────────────────────────────┐
│  LangGraph Platform            │
│                                │
│  assistants.search():          │
│    → Filters by user_id        │
│    → Returns only user's agents│
│                                │
│  assistants.create():          │
│    → Sets user_id in metadata  │
│    → Agent owned by user       │
│                                │
│  assistants.update():          │
│    → Verifies ownership        │
│    → Rejects if not owner      │
└────────┬───────────────────────┘
         │
         ▼

Layer 5: STORE ISOLATION
════════════════════════
┌────────────────────────────────┐
│  PostgreSQL Store              │
│                                │
│  Auth handler enforces:        │
│  - First namespace element     │
│    MUST be user_id             │
│                                │
│  Valid: (user-123, "audit", "ops")
│  Invalid: ("global", "audit")  │
│                                │
│  → Cannot access other users'  │
│    store data                  │
└────────────────────────────────┘

Layer 6: CONFIRMATION GATES
═══════════════════════════
┌────────────────────────────────┐
│  Safety Checks                 │
│                                │
│  if require_confirmation:      │
│    - Agent creation → confirm  │
│    - Agent update → confirm    │
│    - Agent deletion → confirm  │
│                                │
│  delete_agent_tool():          │
│    if not confirm_flag:        │
│      return "Need confirmation"│
│                                │
│  → Prevents accidental actions │
└────────────────────────────────┘
```

---

## Tool Execution Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TOOL EXECUTION LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────────┘

1. LLM DECISION
   ════════════
   Orchestrator LLM analyzes user message
   Decides: "Need to call create_agent_tool"

   Tool call: {
     "name": "create_agent_tool",
     "arguments": {
       "deployment_id": "abc-123",
       "graph_id": "agent",
       "name": "Code Generator",
       "config": {...}
     }
   }

   ↓

2. TOOL INVOCATION
   ═══════════════
   LangGraph runtime invokes tool function

   @tool
   async def create_agent_tool(
       deployment_id: str,
       graph_id: str,
       name: str,
       config: Dict[str, Any]
   ) -> str:
       # Tool implementation

   ↓

3. CONTEXT ACCESS
   ════════════════
   Tool accesses runtime context

   from langgraph.config import get_config

   runtime_config = get_config()
   user_id = runtime_config["configurable"]["user_id"]
   access_token = runtime_config["configurable"]["x-supabase-access-token"]

   ↓

4. CLIENT CREATION
   ═══════════════
   Create LangGraph SDK client with user auth

   from langchain_langgraph_sdk import Client

   deployment = get_deployment_by_id(deployment_id)

   client = Client(
       apiUrl=deployment["deploymentUrl"],
       defaultHeaders={
           "Authorization": f"Bearer {access_token}",
           "x-supabase-access-token": access_token,
       }
   )

   ↓

5. API OPERATION
   ═════════════
   Execute operation via SDK

   assistant = await client.assistants.create(
       graphId=graph_id,
       name=name,
       metadata={"description": "..."},
       config={"configurable": config}
   )

   → Sends HTTP POST to deployment
   → Deployment validates auth
   → Creates assistant in platform DB
   → Returns assistant object

   ↓

6. AUDIT LOGGING
   ═════════════
   Log operation to store

   from langgraph.config import get_store

   store = get_store()
   await store.aput(
       namespace=(user_id, "orchestrator", "audit"),
       key=f"op_{timestamp}",
       value={
           "operation": "create_agent",
           "agent_id": assistant.assistant_id,
           "config": config,
           "success": True,
           "timestamp": datetime.now().isoformat(),
       }
   )

   ↓

7. RESULT FORMATTING
   ═══════════════════
   Format result for LLM

   return f"""✅ Successfully created agent!

   Agent Details:
   - Name: {name}
   - ID: {assistant.assistant_id}
   - Graph: {graph_id}
   - Deployment: {deployment['name']}

   Configuration applied:
   {json.dumps(config, indent=2)}

   The agent is now ready to use."""

   ↓

8. LLM RESPONSE
   ════════════
   Orchestrator LLM receives tool result
   Incorporates into response to user
   Streams final message

   "I've successfully created your code generation agent!
    You can now select 'Code Generator' from the agent
    dropdown and start generating code. Would you like
    me to help configure anything else?"
```

---

## Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION DEPLOYMENT LAYOUT                        │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Load Balancer  │
                    │   (NGINX/Caddy)  │
                    └────────┬─────────┘
                             │
                             │ HTTPS
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   OAP UI     │ │ Orchestrator │ │  Tools Agent │
    │  (Next.js)   │ │    Agent     │ │              │
    │  Port 3003   │ │  Port 2029   │ │  Port 2024   │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           │                └────────┬───────┘
           │                         │
           │                         │ LangGraph SDK
           │                         │
           └─────────────┬───────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  Supabase Auth     │
              │  - JWT validation  │
              │  - User management │
              └────────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  PostgreSQL Store  │
              │  - Shared state    │
              │  - Audit logs      │
              │  - Cache           │
              └────────────────────┘

Development Layout:
═══════════════════

localhost:3003  → OAP UI
localhost:2024  → Tools Agent
localhost:2025  → Supervisor Agent
localhost:2026  → Deep Research
localhost:2029  → OAP Orchestrator

All communicate via localhost HTTP
Production would use HTTPS + internal networking
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────┘

Tool Execution Error:
═══════════════════

try:
    client = Client(...)
    result = await client.assistants.create(...)
except AuthenticationError:
    return """❌ Authentication failed.

    Your session may have expired. Please:
    1. Refresh the page
    2. Log in again
    3. Retry the operation
    """

except PermissionError:
    return """❌ Permission denied.

    You don't have access to modify this deployment.
    Contact your administrator or check your permissions.
    """

except ValidationError as e:
    return f"""❌ Invalid configuration: {str(e)}

    Please check:
    - All required fields are provided
    - Field values are within allowed ranges
    - Referenced resources (tools, agents) exist

    Use validate_agent_config_tool() to check configuration.
    """

except NetworkError:
    return """❌ Deployment unavailable.

    The target deployment is not responding. Possible causes:
    - Deployment is offline
    - Network connectivity issues
    - Incorrect deployment URL

    Use list_deployments_tool() to check deployment status.
    """

except Exception as e:
    # Log full error for debugging
    logger.exception(f"Unexpected error in tool: {e}")

    # Return user-friendly message
    return f"""❌ Operation failed: {str(e)}

    An unexpected error occurred. The error has been logged.
    Please try again or contact support if the issue persists.
    """

Graceful Degradation:
═══════════════════

- If one deployment is down, others still work
- If schema fetch fails, use cached schema
- If validation fails, provide clear next steps
- If confirmation timeout, ask again
- If audit logging fails, still complete operation

User Experience:
═══════════════

❌ Bad:
"Error: HTTPStatusError 503"

✅ Good:
"❌ The Tools Agent deployment is currently unavailable.

 I can create your agent on the Supervisor deployment instead,
 or we can wait for Tools Agent to come back online.

 What would you prefer?"
```

---

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PERFORMANCE OPTIMIZATION                            │
└─────────────────────────────────────────────────────────────────────────┘

Caching Strategy:
════════════════

┌─────────────────────────────────┐
│  Cache Layer (Store)            │
│                                 │
│  Namespace: (user_id,           │
│             "orchestrator",     │
│             "cache")            │
│                                 │
│  Cached Data:                   │
│  - Deployment list (1h TTL)    │
│  - Graph schemas (24h TTL)     │
│  - Model registry (1h TTL)     │
│  - Tool catalog (15m TTL)      │
│                                 │
│  Cache hit = instant response  │
│  Cache miss = fetch + cache    │
└─────────────────────────────────┘

Parallel Operations:
═══════════════════

# Sequential (slow):
deployments = await list_deployments()  # 100ms
graphs = await list_graphs(deployments[0])  # 150ms
schema = await get_schema(deployments[0], graphs[0])  # 200ms
Total: 450ms

# Parallel (fast):
deployments, models, tools = await asyncio.gather(
    list_deployments(),
    get_all_models(),
    get_all_tools(),
)
Total: 200ms (slowest operation)

Batch Operations:
════════════════

# Create multiple agents in one conversation:
agents_to_create = [
    {"name": "Agent 1", "config": {...}},
    {"name": "Agent 2", "config": {...}},
    {"name": "Agent 3", "config": {...}},
]

# Parallel creation:
results = await asyncio.gather(*[
    create_agent_tool(**agent_config)
    for agent_config in agents_to_create
])

Response Streaming:
══════════════════

┌─────────────────────────────────┐
│  Streaming Progress Updates     │
│                                 │
│  1. User sends message          │
│  2. Orchestrator streams:       │
│     "Checking deployments..."   │
│  3. Tool executes               │
│  4. Orchestrator streams:       │
│     "Creating agent..."         │
│  5. Tool completes              │
│  6. Orchestrator streams:       │
│     "✅ Done!"                  │
│                                 │
│  User sees live progress        │
│  Feels responsive               │
└─────────────────────────────────┘

Rate Limiting:
═════════════

┌─────────────────────────────────┐
│  Protection Against Abuse       │
│                                 │
│  Store-based rate limiting:     │
│  - Max 10 creates/hour/user     │
│  - Max 50 updates/hour/user     │
│  - Max 5 deletes/hour/user      │
│                                 │
│  Check before operation:        │
│  recent_ops = await store.asearch(
│      namespace=(user, "audit"),
│      filter={"since": 1h_ago}
│  )                              │
│  if len(recent_ops) > limit:    │
│      return "Rate limit hit"    │
└─────────────────────────────────┘
```

This architecture enables the OAP Orchestrator to provide fast, reliable, and secure agent management through natural language interaction.