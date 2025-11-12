# Open Agent Platform - Quick Start Guide

**Get ALL your agents running in 3 steps!**

---

## Prerequisites

✅ You should have already cloned these repositories:
- `open-agent-platform`
- `oap-langgraph-tools-agent`
- `oap-agent-supervisor`
- `open_deep_research`
- `multi-modal-researcher`
- `open-swe`
- `langgraph-app-example`

---

## Step 1: Setup (One-Time)

### 1.1 Run the Setup Script

```bash
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/open-agent-platform
python3 setup_all_agents.py
```

**What it does:**
- ✅ Copies authentication handlers to all agents
- ✅ Updates langgraph.json files
- ✅ Creates .env templates with Supabase configuration
- ✅ Verifies all repositories

### 1.2 Configure Environment Variables

**For each agent, edit its `.env` file:**

**Required for ALL agents:**
```bash
SUPABASE_URL="https://gctunhsuwpaxeatwlmuv.supabase.co"
SUPABASE_KEY="<your-service-role-key-here>"
```

**Tools Agent + Supervisor + Deep Research:**
```bash
OPENAI_API_KEY="sk-..." or OLLAMA_API_KEY="your-ollama-turbo-key"
# OR
ANTHROPIC_API_KEY="sk-ant-..." (or use OLLAMA_API_KEY for Ollama Turbo)
```

**Multi-Modal Researcher:**
```bash
GEMINI_API_KEY="..."
```

**Deep Research (optional search APIs):**
```bash
TAVILY_API_KEY="tvly-..."
EXA_API_KEY="..."
```

**Fractal Analysis:**
```bash
OPENAI_API_KEY="sk-..." or OLLAMA_API_KEY="your-ollama-turbo-key"
# OR
ANTHROPIC_API_KEY="sk-ant-..." (or use OLLAMA_API_KEY for Ollama Turbo)
```

### 1.3 Install Dependencies

**For each agent that needs it:**

```bash
# Tools Agent
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/oap-langgraph-tools-agent
uv venv && source .venv/bin/activate && uv sync

# Supervisor
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/oap-agent-supervisor
uv venv && source .venv/bin/activate && uv sync

# Deep Research
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/open_deep_research
uv venv && source .venv/bin/activate && uv sync

# Multi-Modal (might already have venv)
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/multi-modal-researcher
uv venv && source .venv/bin/activate && uv sync

# Fractal Analysis (might already have venv)
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/langgraph-app-example
python -m venv venv && source venv/bin/activate && pip install -e .

# OAP (if not done)
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/open-agent-platform
yarn install
```

---

## Step 2: Launch Everything

### Option A: Interactive Launcher (Recommended)

```bash
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/open-agent-platform
python3 launch_all_agents.py
```

**Choose from:**
- `[A]` Start ALL agents + OAP
- `[R]` Start READY agents (Tools + Supervisor) + OAP ⭐ **Recommended**
- `[C]` Custom selection
- `[O]` OAP only

### Option B: Command Line

```bash
# Start only ready agents
python3 launch_all_agents.py --ready

# Start everything
python3 launch_all_agents.py --all

# Start specific agents (1=Tools, 2=Supervisor, 3=Deep Research, etc.)
python3 launch_all_agents.py --agents 1,2,3

# Start just OAP (if agents already running)
python3 launch_all_agents.py --oap-only
```

### Option C: Manual (Old Way)

**Terminal 1 - Tools Agent:**
```bash
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/oap-langgraph-tools-agent
source .venv/bin/activate
uv run langgraph dev --no-browser --port 2024
```

**Terminal 2 - Supervisor:**
```bash
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/oap-agent-supervisor
source .venv/bin/activate
uv run langgraph dev --no-browser --port 2025
```

**Terminal 3 - OAP:**
```bash
cd /mnt/c/00_ConceptV/06_Project_Vi/repos/open-agent-platform
yarn dev
```

---

## Step 3: Access & Use

### Open Agent Platform

Navigate to: **http://localhost:3003**

You should see all running agents available in the UI!

### Verify Agents Are Running

```bash
# Tools Agent
curl http://127.0.0.1:2024/info

# Supervisor
curl http://127.0.0.1:2025/info

# Deep Research (if started)
curl http://127.0.0.1:2026/info

# Should return JSON with project_id and tenant_id
```

---

## Port Reference

| Port | Agent | Status |
|------|-------|--------|
| 2024 | Tools Agent | ✅ Ready |
| 2025 | Supervisor | ✅ Ready |
| 2026 | Deep Research | ⚠️  Needs testing |
| 2027 | Multi-Modal Researcher | 🔧 After setup |
| 2028 | Open SWE | ⚠️  Custom auth |
| 2030 | Fractal Analysis (6 graphs) | 🔧 After setup |
| 3003 | Open Agent Platform (UI) | ✅ Always |

---

## Stopping Everything

### If using launcher:
**Press `Ctrl+C`** - It will stop all processes gracefully.

### If running manually:
**Press `Ctrl+C` in each terminal window.**

---

## Troubleshooting

### Agent won't start

**Check if port is in use:**
```bash
lsof -i :2024  # or whichever port
```

**Kill process on port:**
```bash
kill -9 $(lsof -t -i:2024)
```

### Authentication errors

**Verify Supabase configuration:**
```bash
# Check .env file has:
SUPABASE_URL="https://gctunhsuwpaxeatwlmuv.supabase.co"
SUPABASE_KEY="<service-role-key>"
```

### Agent not showing in OAP

**Check agent is running:**
```bash
curl http://127.0.0.1:<port>/info
```

**Check OAP configuration:**
```bash
# In apps/web/.env, verify NEXT_PUBLIC_DEPLOYMENTS includes the agent
cat apps/web/.env | grep NEXT_PUBLIC_DEPLOYMENTS
```

### Port already in use

**Change port in launcher script (`launch_all_agents.py`):**
```python
# Edit the AGENTS list to use a different port
"port": 2034,  # Change from 2024 to 2034
```

**Then update OAP `.env` to match:**
```bash
"deploymentUrl": "http://127.0.0.1:2034"
```

---

## Adding More Agents Later

### To add an agent to OAP after it's running:

1. **Start the agent** (manually or via launcher)

2. **Get its info:**
   ```bash
   curl http://127.0.0.1:<port>/info
   ```

3. **Add to `apps/web/.env`:**
   ```bash
   # Add to the NEXT_PUBLIC_DEPLOYMENTS array:
   {"id":"<project_id>","deploymentUrl":"http://127.0.0.1:<port>","tenantId":"53777834-a451-4cc8-a22d-df02e94cfd67","name":"Agent Name","isDefault":false}
   ```

4. **Restart OAP**

---

## Advanced: PM2 for Production

For keeping agents running permanently:

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file from agents
pm2 ecosystem

# Start all with PM2
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs

# Stop all
pm2 stop all

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

---

## What's Next?

### Explore Your Agents

1. **Tools Agent** - Try MCP tools and RAG collections
2. **Supervisor** - Configure it to delegate to other agents
3. **Deep Research** - Run comprehensive research queries
4. **Multi-Modal** - Analyze YouTube videos and generate podcasts
5. **Fractal Analysis** - Use Vi for code analysis

### Customize

- **Modify agent behaviors** - Edit configuration in each agent's code
- **Add new agents** - Follow the pattern in `LANGGRAPH_AGENTS_REGISTRY.md`
- **Extend OAP** - Add custom features to the platform

### Resources

- `LANGGRAPH_AGENTS_REGISTRY.md` - Complete agent reference
- `setup_all_agents.py` - Setup script source code
- `launch_all_agents.py` - Launcher script source code
- Each agent's `README.md` - Agent-specific documentation

---

## Success Indicators

✅ You're ready when you see:

1. **Launcher shows:** "All Services Running"
2. **OAP loads at:** http://localhost:3003
3. **Agent dropdown** shows multiple agents
4. **Can create** new assistants from different graphs
5. **Chat works** with all agents

---

**🎉 You now have a complete multi-agent platform running locally!**

**Questions?** See `LANGGRAPH_AGENTS_REGISTRY.md` for detailed agent documentation.