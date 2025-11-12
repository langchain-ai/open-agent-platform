# Ollama Turbo + LangGraph Complete Implementation Guide
**Universal Setup Guide for Any LangGraph Project**

## Executive Summary

This guide provides everything needed to integrate Ollama Turbo (cloud-hosted Ollama) or Local Ollama into any LangGraph project, with full environment variable control and flexible configuration.

**What You Get:**
- ✅ Switch between Ollama Turbo (cloud, paid, fast) and Local Ollama (free, your hardware)
- ✅ Switch between Ollama and Anthropic Claude (or any provider)
- ✅ Per-agent model customization (different models for different agents)
- ✅ Zero code changes needed - all controlled via `.env` file
- ✅ Automatic detection of Turbo vs Local based on configuration
- ✅ Clear error messages when something is misconfigured

---

## Part 1: Understanding Ollama Options

### Option 1: Local Ollama (Free)
- **Cost**: Free
- **Location**: Runs on your machine
- **Performance**: Depends on your hardware (GPU/CPU)
- **Privacy**: Complete - nothing leaves your machine
- **Setup**: Install Ollama, download models, run locally
- **Endpoint**: `http://localhost:11434`
- **Auth**: None required

### Option 2: Ollama Turbo (Paid - $20/month)
- **Cost**: $20/month subscription
- **Location**: Cloud infrastructure (datacenter GPUs)
- **Performance**: Very fast - professional hardware
- **Privacy**: No prompt logging (privacy-first)
- **Setup**: Get API key from https://ollama.com/account
- **Endpoint**: `https://ollama.com`
- **Auth**: Bearer token required

### Option 3: Custom Ollama Deployment
- **Cost**: Depends on your infrastructure
- **Location**: Your own servers/cloud
- **Performance**: Depends on your setup
- **Privacy**: You control everything
- **Setup**: Deploy Ollama yourself, configure endpoint
- **Endpoint**: Your custom URL
- **Auth**: Optional (depends on your setup)

---

## Part 2: Ollama Models (October 2025)

### Ollama Turbo Cloud Models (Require $20/mo Subscription)
Currently supported Turbo models with cloud acceleration:

| Model | Size | Speed | Best For |
|-------|------|-------|----------|
| `gpt-oss:20b` | 20B params | Up to 1200 tok/s | General purpose, reasoning, fast responses |
| `gpt-oss:120b` | 120B params | Up to 1200 tok/s | Complex tasks, long context, high quality |
| `deepseek-v3.1:671b` | 671B params | Up to 1200 tok/s | State-of-the-art reasoning, research |

**How to use with Turbo**: Set `OLLAMA_BASE_URL=https://ollama.com` and provide `OLLAMA_API_KEY`
**Note**: Check https://ollama.com/cloud for the latest available models

### Top Local Models (October 2025) - Free, Run on Your Hardware

#### Best for Reasoning & General Purpose:
| Model | Size | Strengths | Download |
|-------|------|-----------|----------|
| `deepseek-r1:70b` | 70B | Excellent reasoning, complex logic | `ollama pull deepseek-r1:70b` |
| `deepseek-r1:32b` | 32B | Strong reasoning, good balance | `ollama pull deepseek-r1:32b` |
| `llama3.3:70b` | 70B | Versatile, strong general purpose | `ollama pull llama3.3:70b` |
| `qwen2.5:72b` | 72B | Multilingual, strong reasoning | `ollama pull qwen2.5:72b` |

#### Best for Coding:
| Model | Size | Strengths | Download |
|-------|------|-----------|----------|
| `qwen2.5-coder:32b` | 32B | Excellent code understanding, generation | `ollama pull qwen2.5-coder:32b` |
| `qwen2.5-coder:7b` | 7B | Fast coding assistance | `ollama pull qwen2.5-coder:7b` |
| `deepseek-coder:33b` | 33B | Code generation specialist | `ollama pull deepseek-coder:33b` |
| `codellama:34b` | 34B | Code completion, understanding | `ollama pull codellama:34b` |

#### Best for Multimodal (Vision + Text):
| Model | Size | Strengths | Download |
|-------|------|-----------|----------|
| `llama4-scout:109b` | 109B | Advanced vision-language understanding | `ollama pull llama4-scout:109b` |
| `llava:34b` | 34B | Vision tasks, image understanding | `ollama pull llava:34b` |
| `qwen2.5-vl:72b` | 72B | Document scanning, OCR, multimodal | `ollama pull qwen2.5-vl:72b` |

#### Best for Edge/Low-Resource:
| Model | Size | Strengths | Download |
|-------|------|-----------|----------|
| `phi-4:14b` | 14B | Edge-optimized, efficient | `ollama pull phi-4:14b` |
| `gemma2:9b` | 9B | Fast, lightweight | `ollama pull gemma2:9b` |
| `mistral:7b` | 7B | Efficient general purpose | `ollama pull mistral:7b` |
| `llama3.2:3b` | 3B | Very fast, minimal resources | `ollama pull llama3.2:3b` |

#### Best for Embeddings (Semantic Search):
| Model | Dimensions | Strengths | Download |
|-------|-----------|-----------|----------|
| `nomic-embed-text` | 768 | General-purpose embeddings (recommended) | `ollama pull nomic-embed-text` |
| `mxbai-embed-large` | 1024 | High-quality semantic search | `ollama pull mxbai-embed-large` |
| `all-minilm` | 384 | Fast, smaller, good quality | `ollama pull all-minilm` |

**Check what you have installed**: `ollama list`
**Browse all models**: https://ollama.com/library

---

## Part 3: Complete Code Implementation

### File to Create/Update: `src/your_package/model.py`

```python
"""
Model Provider Configuration for LangGraph Agents

Supports:
- Anthropic Claude (API, paid)
- Ollama Local (free, runs locally)
- Ollama Turbo (paid $20/mo, cloud inference)
- Custom Ollama deployments

Environment Variables:
======================
MODEL_PROVIDER: "anthropic" | "ollama"
OLLAMA_MODEL: Model name (with or without -cloud suffix)
OLLAMA_BASE_URL: Endpoint URL
OLLAMA_API_KEY: For authenticated endpoints (Turbo, custom)
OLLAMA_TEMPERATURE: 0.0-1.0 (default: 0.7)
ANTHROPIC_API_KEY: For Claude
ANTHROPIC_MODEL: Claude model name

Per-Agent Overrides:
{AGENT_NAME}_MODEL_PROVIDER: Override provider for specific agent
{AGENT_NAME}_OLLAMA_MODEL: Override Ollama model
{AGENT_NAME}_OLLAMA_BASE_URL: Override endpoint
{AGENT_NAME}_OLLAMA_API_KEY: Override API key
"""

import os
from typing import Optional
from langchain_core.language_models import LanguageModelLike


def get_default_model() -> LanguageModelLike:
    """
    Get the default model based on environment configuration.
    
    Auto-detects:
    - Ollama Turbo: If OLLAMA_API_KEY is set
    - Local Ollama: If OLLAMA_API_KEY is not set
    - Anthropic: If MODEL_PROVIDER=anthropic
    
    Returns:
        LanguageModelLike: Configured model instance
    
    Raises:
        ValueError: If MODEL_PROVIDER is unsupported
        ImportError: If required package not installed
        RuntimeError: If Turbo endpoint configured but API key missing
    """
    provider = os.getenv("MODEL_PROVIDER", "anthropic").lower().strip()
    
    if provider == "ollama":
        try:
            from langchain_ollama import ChatOllama
        except ImportError:
            raise ImportError(
                "langchain-ollama is not installed. "
                "Install it with: pip install langchain-ollama>=0.3.8"
            )
        
        model_name = os.getenv("OLLAMA_MODEL", "llama3.1")
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        api_key = os.getenv("OLLAMA_API_KEY")
        temperature = float(os.getenv("OLLAMA_TEMPERATURE", "0.7"))
        num_predict = int(os.getenv("OLLAMA_NUM_PREDICT", "-1"))
        
        # Build ChatOllama kwargs
        kwargs = {
            "model": model_name,
            "base_url": base_url,
            "temperature": temperature,
        }
        
        # Add authentication if API key provided
        # This enables: Ollama Turbo, custom deployments with auth
        if api_key:
            kwargs["headers"] = {"Authorization": f"Bearer {api_key}"}
            print(f"🚀 Initializing Ollama (authenticated): {model_name}")
            print(f"   - Endpoint: {base_url}")
            print(f"   - Auth: Enabled (key: {api_key[:8]}...)")
        else:
            print(f"🤖 Initializing Ollama (local/no-auth): {model_name}")
            print(f"   - Endpoint: {base_url}")
            print(f"   - Auth: None")
        
        # Add max tokens if specified
        if num_predict != -1:
            kwargs["num_predict"] = num_predict
        
        return ChatOllama(**kwargs)
    
    elif provider == "anthropic":
        try:
            from langchain_anthropic import ChatAnthropic
        except ImportError:
            raise ImportError(
                "langchain-anthropic is not installed. "
                "Install it with: pip install langchain-anthropic>=0.1.23"
            )
        
        model_name = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        max_tokens = int(os.getenv("ANTHROPIC_MAX_TOKENS", "64000"))
        
        print(f"🤖 Initializing Anthropic model: {model_name}")
        
        return ChatAnthropic(
            model_name=model_name,
            max_tokens=max_tokens,
        )
    
    else:
        raise ValueError(
            f"Unknown MODEL_PROVIDER: '{provider}'. "
            f"Supported: 'anthropic', 'ollama'"
        )


def get_model_for_agent(agent_name: str) -> Optional[LanguageModelLike]:
    """
    Get agent-specific model override if configured.
    
    Allows different agents to use different models/providers.
    Returns None if no override configured (use default).
    
    Environment variables:
    - {AGENT}_MODEL_PROVIDER: anthropic | ollama
    - {AGENT}_OLLAMA_MODEL: Model name
    - {AGENT}_OLLAMA_BASE_URL: Endpoint (optional)
    - {AGENT}_OLLAMA_API_KEY: API key (optional)
    - {AGENT}_ANTHROPIC_MODEL: Claude model (optional)
    
    Args:
        agent_name: Agent name (e.g. "critique", "research", "synthesis")
    
    Returns:
        Model instance if override exists, None otherwise
    
    Example:
        # Main agents use local Ollama
        MODEL_PROVIDER=ollama
        OLLAMA_MODEL=llama3.1
        
        # But critique uses Turbo for better quality
        CRITIQUE_MODEL_PROVIDER=ollama
        CRITIQUE_OLLAMA_MODEL=gpt-oss:120b-cloud
        CRITIQUE_OLLAMA_BASE_URL=https://ollama.com
        CRITIQUE_OLLAMA_API_KEY=your-turbo-key
    """
    agent_key = agent_name.upper().replace("-", "_").replace(" ", "_")
    agent_provider = os.getenv(f"{agent_key}_MODEL_PROVIDER")
    
    if not agent_provider:
        return None  # No override
    
    agent_provider = agent_provider.lower().strip()
    
    if agent_provider == "ollama":
        try:
            from langchain_ollama import ChatOllama
        except ImportError:
            print(f"⚠️  {agent_name}: Ollama configured but package not installed")
            return None
        
        model_name = os.getenv(
            f"{agent_key}_OLLAMA_MODEL",
            os.getenv("OLLAMA_MODEL", "llama3.1")
        )
        base_url = os.getenv(
            f"{agent_key}_OLLAMA_BASE_URL",
            os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        )
        api_key = os.getenv(
            f"{agent_key}_OLLAMA_API_KEY",
            os.getenv("OLLAMA_API_KEY")
        )
        
        kwargs = {
            "model": model_name,
            "base_url": base_url,
            "temperature": float(os.getenv("OLLAMA_TEMPERATURE", "0.7")),
        }
        
        if api_key:
            kwargs["headers"] = {"Authorization": f"Bearer {api_key}"}
            print(f"🚀 {agent_name}: Ollama (auth) {model_name} at {base_url}")
        else:
            print(f"🤖 {agent_name}: Ollama (local) {model_name} at {base_url}")
        
        return ChatOllama(**kwargs)
    
    elif agent_provider == "anthropic":
        try:
            from langchain_anthropic import ChatAnthropic
        except ImportError:
            print(f"⚠️  {agent_name}: Anthropic configured but package not installed")
            return None
        
        model_name = os.getenv(
            f"{agent_key}_ANTHROPIC_MODEL",
            os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        )
        
        print(f"🤖 {agent_name}: Anthropic {model_name}")
        
        return ChatAnthropic(model_name=model_name, max_tokens=64000)
    
    return None
```

---

## Part 4: Dependencies to Add

### File: `pyproject.toml` or `requirements.txt`

#### If using `pyproject.toml`:
```toml
[project]
dependencies = [
    "langgraph>=0.2.6",
    "langchain>=2.5.0",
    "langchain-anthropic>=0.1.23",  # For Claude
    "langchain-ollama>=0.3.8",      # For Ollama (local + Turbo)
    "ollama>=0.1.34",                # Ollama Python client
]
```

#### If using `requirements.txt`:
```
langgraph>=0.2.6
langchain>=2.5.0
langchain-anthropic>=0.1.23
langchain-ollama>=0.3.8
ollama>=0.1.34
```

### Install Command:
```bash
# If using pyproject.toml (editable install)
pip install -e .

# If using requirements.txt
pip install -r requirements.txt

# Or install packages directly
pip install langchain>=2.5.0 langchain-ollama>=0.3.8 ollama>=0.1.34
```

---

## Part 5: Environment Configuration

### File: `.env` (in the directory where you run `langgraph dev`)

```bash
# ============================================
# OLLAMA TURBO CONFIGURATION
# ============================================
# Complete template with all options
# Copy this entire section and customize
# ============================================

# ============================================
# PROVIDER SELECTION (Required)
# ============================================
# Which provider to use for all agents
# Options: "anthropic" | "ollama"
# Default: "anthropic"
MODEL_PROVIDER=ollama

# ============================================
# OLLAMA TURBO SETUP
# ============================================
# Configuration for Ollama Turbo cloud service

# Model name - MUST have -cloud suffix for Turbo
# Available Turbo models (as of Sept 2025):
# - gpt-oss:20b-cloud
# - gpt-oss:120b-cloud  
# - deepseek-v3.1:671b-cloud
# Check current list: https://ollama.com/cloud
OLLAMA_MODEL=gpt-oss:120b-cloud

# Ollama Turbo endpoint (use https://ollama.com for Turbo)
OLLAMA_BASE_URL=https://ollama.com

# Ollama Turbo API key (REQUIRED for Turbo)
# Get from: https://ollama.com/account → API → Create key
# Treat this like any other API key (keep it secret)
OLLAMA_API_KEY=your-ollama-turbo-api-key-here

# Optional: Temperature (0.0 = deterministic, 1.0 = creative)
# OLLAMA_TEMPERATURE=0.7

# Optional: Max tokens to generate (-1 = unlimited)
# OLLAMA_NUM_PREDICT=-1

# ============================================
# LOCAL OLLAMA SETUP (Alternative)
# ============================================
# To use local Ollama instead of Turbo, configure:

# MODEL_PROVIDER=ollama
# OLLAMA_MODEL=llama3.1  # or any model you have installed locally
# OLLAMA_BASE_URL=http://localhost:11434  # local endpoint
# # OLLAMA_API_KEY not needed for local

# Check installed models: ollama list
# Download models: ollama pull llama3.1

# ============================================
# ANTHROPIC CONFIGURATION (Alternative Provider)
# ============================================
# To use Claude instead of Ollama

# MODEL_PROVIDER=anthropic
# ANTHROPIC_API_KEY=your-anthropic-api-key
# ANTHROPIC_MODEL=claude-sonnet-4-20250514
# ANTHROPIC_MAX_TOKENS=64000

# ============================================
# PER-AGENT MODEL OVERRIDES (Optional Advanced)
# ============================================
# Allow specific agents to use different models
# Only add if you want this feature
# Pattern: {AGENT_NAME}_MODEL_PROVIDER, {AGENT_NAME}_OLLAMA_MODEL, etc.
# ============================================

# Example: Main agents use local Ollama (fast, free)
# MODEL_PROVIDER=ollama
# OLLAMA_MODEL=llama3.1
# OLLAMA_BASE_URL=http://localhost:11434

# Example: But critique agent uses Turbo (better quality)
# CRITIQUE_MODEL_PROVIDER=ollama
# CRITIQUE_OLLAMA_MODEL=gpt-oss:120b-cloud
# CRITIQUE_OLLAMA_BASE_URL=https://ollama.com
# CRITIQUE_OLLAMA_API_KEY=your-turbo-key

# Example: Research agent uses Anthropic Claude
# RESEARCH_MODEL_PROVIDER=anthropic
# RESEARCH_ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Common agent names (adjust to your actual agents):
# RESEARCH, CRITIQUE, SYNTHESIS, DOCS, LOCAL_FILES, RAG, 
# WEB_RESEARCH, SUPERVISOR, TOOLS, SWARM, TEAM

# ============================================
# OTHER API KEYS (Project-specific)
# ============================================
# Add your other API keys below
# TAVILY_API_KEY=your-tavily-key
# LANGSMITH_API_KEY=your-langsmith-key
# LANGSMITH_PROJECT=your-project-name
```

---

## Part 6: How to Use in Your Agent Code

### Where Models Are Used

In LangGraph projects, models are typically initialized in one of these patterns:

#### Pattern 1: Direct Model Creation (Simple Agents)
```python
# In your graph.py or agent.py file
from your_package.model import get_default_model

# When creating your agent
model = get_default_model()

# Use in LangGraph
from langgraph.prebuilt import create_react_agent
agent = create_react_agent(model, tools, prompt)
```

#### Pattern 2: Agent Builder Function (Deep Agents)
```python
# If you use create_deep_agent or similar builder
from deepagents import create_deep_agent
from your_package.model import get_default_model

# The builder typically has a model parameter
agent = create_deep_agent(
    tools=[...],
    instructions="...",
    model=None,  # None = uses get_default_model() internally
)

# Or pass a specific model
agent = create_deep_agent(
    tools=[...],
    instructions="...",
    model=get_default_model(),  # Explicit
)
```

#### Pattern 3: Per-Agent Model Selection
```python
from your_package.model import get_default_model, get_model_for_agent

# Main agent uses default
main_model = get_default_model()

# Critique agent might use different model
critique_model = get_model_for_agent("critique") or get_default_model()

# Create agents with different models
main_agent = create_deep_agent(..., model=main_model)
critique_agent = create_deep_agent(..., model=critique_model)
```

### Integration Points

**Find where your project creates models:**
1. Search for: `ChatAnthropic`, `ChatOpenAI`, `ChatOllama`
2. Replace hardcoded model creation with `get_default_model()`
3. Ensure `get_default_model()` is called (not hardcoded model instances)

**Common locations:**
- `src/agent/graph.py` - Main agent creation
- `src/models.py` or `src/model.py` - Model configuration
- Agent builder functions
- Sub-agent definitions

---

## Part 7: Testing the Setup

### Test 1: Verify Environment Variables
```bash
# Check your .env is loaded
cd your-langgraph-project/
cat .env | grep MODEL_PROVIDER
cat .env | grep OLLAMA
```

### Test 2: Test Ollama Turbo Connection
```python
# test_ollama_turbo.py
import os
from langchain_ollama import ChatOllama

api_key = os.getenv("OLLAMA_API_KEY")
if not api_key:
    print("❌ OLLAMA_API_KEY not set in .env")
    exit(1)

model = ChatOllama(
    model="gpt-oss:20b-cloud",  # Small Turbo model for testing
    base_url="https://ollama.com",
    headers={"Authorization": f"Bearer {api_key}"},
)

response = model.invoke("Say hello in 3 languages")
print(f"✅ Ollama Turbo working!")
print(f"Response: {response.content}")
```

Run: `python test_ollama_turbo.py`

### Test 3: Test in LangGraph
```bash
# Start your LangGraph server
langgraph dev --port 4302

# Check startup logs for:
# 🚀 Initializing Ollama (authenticated): gpt-oss:120b-cloud
#    - Endpoint: https://ollama.com
#    - Auth: Enabled
```

### Test 4: Send a Message
Use your frontend or API client to send a message. Watch for:
- Model initialization logs
- No errors about missing API keys
- Responses are generated successfully

---

## Part 8: Configuration Examples

### Example 1: Pure Ollama Turbo (All Agents)
```bash
MODEL_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_API_KEY=your-turbo-key
```

### Example 2: Pure Local Ollama (All Agents)
```bash
MODEL_PROVIDER=ollama
OLLAMA_MODEL=deepseek-r1:32b
OLLAMA_BASE_URL=http://localhost:11434
# No OLLAMA_API_KEY needed
```

### Example 3: Mix Turbo + Local
```bash
# Default: Local Ollama (fast, free)
MODEL_PROVIDER=ollama
OLLAMA_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434

# Critique: Ollama Turbo (better quality)
CRITIQUE_MODEL_PROVIDER=ollama
CRITIQUE_OLLAMA_MODEL=gpt-oss:120b-cloud
CRITIQUE_OLLAMA_BASE_URL=https://ollama.com
CRITIQUE_OLLAMA_API_KEY=your-turbo-key
```

### Example 4: Mix Ollama + Anthropic
```bash
# Default: Ollama Turbo
MODEL_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_API_KEY=your-turbo-key

# Synthesis: Anthropic Claude (best quality)
SYNTHESIS_MODEL_PROVIDER=anthropic
SYNTHESIS_ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Required for Anthropic override
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Part 9: Troubleshooting

### Error: "langchain-ollama is not installed"
**Solution**:
```bash
pip install langchain-ollama>=0.3.8 ollama>=0.1.34
```

### Error: "Model 'gpt-oss:120b-cloud' is an Ollama Turbo cloud model but OLLAMA_API_KEY is not set"
**Solution**:
1. Get API key from https://ollama.com/account
2. Add to `.env`: `OLLAMA_API_KEY=your-key-here`

### Error: "401 Unauthorized" when using Turbo
**Solution**:
1. Check API key is correct in `.env`
2. Verify key is not expired: https://ollama.com/account
3. Check you have active Turbo subscription ($20/mo)

### Error: "404 Model not found"
**Solution**:
- For Turbo: Check model name has `-cloud` suffix and exists on https://ollama.com/cloud
- For Local: Run `ollama pull <model-name>` first

### Error: "Connection refused" to localhost:11434
**Solution**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Or check if it's already running (it usually auto-starts)
ps aux | grep ollama
```

### Error: Model not using Turbo (still calling localhost)
**Solution**:
1. Check `OLLAMA_BASE_URL=https://ollama.com` in `.env`
2. Restart your LangGraph server to reload `.env`
3. Check startup logs show correct endpoint

---

## Part 10: Quick Decision Matrix

### When to Use Each Option:

| Scenario | Recommended Setup | Why |
|----------|------------------|-----|
| Development/Testing | Local Ollama | Free, fast iteration |
| Production (High Volume) | Ollama Turbo | Consistent performance, no hardware costs |
| Privacy-Critical | Local Ollama | Nothing leaves your network |
| Mixed Workload | Turbo for complex, Local for simple | Optimize cost vs performance |
| Need Best Quality | Anthropic Claude | State-of-the-art reasoning |
| Cost-Sensitive | Local Ollama | Zero API costs |

### Model Selection:

| Task Type | Recommended Model | Provider |
|-----------|------------------|----------|
| General research | `gpt-oss:120b-cloud` | Ollama Turbo |
| Code analysis | `qwen2.5-coder:32b` | Local Ollama |
| Fast responses | `gpt-oss:20b-cloud` | Ollama Turbo |
| Best quality | `claude-sonnet-4-20250514` | Anthropic |
| Reasoning heavy | `deepseek-v3.1:671b-cloud` | Ollama Turbo |
| Budget/Local | `llama3.1` or `mistral` | Local Ollama |

---

## Part 11: Migration Checklist

Use this checklist when adding Ollama support to an existing LangGraph project:

- [ ] **1. Find model configuration**
  - [ ] Locate where models are created (search for `ChatAnthropic`, `ChatOpenAI`)
  - [ ] Identify if there's a central model configuration file

- [ ] **2. Create/update `model.py`**
  - [ ] Copy the code from Part 3 into your project
  - [ ] Adjust import paths to match your project structure

- [ ] **3. Update dependencies**
  - [ ] Add `langchain-ollama>=0.3.8` to pyproject.toml or requirements.txt
  - [ ] Add `ollama>=0.1.34`
  - [ ] Run `pip install -e .` or `pip install -r requirements.txt`

- [ ] **4. Replace hardcoded models**
  - [ ] Replace `ChatAnthropic(...)` with `get_default_model()`
  - [ ] Ensure models aren't hardcoded in agent builders
  - [ ] Check sub-agent definitions for hardcoded models

- [ ] **5. Configure `.env` file**
  - [ ] Add `MODEL_PROVIDER=ollama`
  - [ ] Add `OLLAMA_MODEL=gpt-oss:120b-cloud` (or your choice)
  - [ ] Add `OLLAMA_BASE_URL=https://ollama.com`
  - [ ] Add `OLLAMA_API_KEY=your-key`

- [ ] **6. Test the setup**
  - [ ] Run test script from Part 7
  - [ ] Start LangGraph server, check startup logs
  - [ ] Send test message, verify it works
  - [ ] Check logs show correct model/endpoint

- [ ] **7. Optional: Per-agent customization**
  - [ ] Identify agents that need different models
  - [ ] Add agent-specific env vars
  - [ ] Test each agent works with its assigned model

---

## Part 12: Common Patterns by Project Type

### Pattern A: Research Agent
**Best Setup**: Ollama Turbo 120B for quality
```bash
MODEL_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_API_KEY=your-turbo-key
```

### Pattern B: Multi-Agent Team
**Best Setup**: Mix of Turbo and Local
```bash
# Default: Local for speed/cost
MODEL_PROVIDER=ollama
OLLAMA_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434

# Synthesis uses Turbo for quality
SYNTHESIS_MODEL_PROVIDER=ollama
SYNTHESIS_OLLAMA_MODEL=gpt-oss:120b-cloud
SYNTHESIS_OLLAMA_BASE_URL=https://ollama.com
SYNTHESIS_OLLAMA_API_KEY=your-turbo-key
```

### Pattern C: Code Analysis Agent
**Best Setup**: Local coder model
```bash
MODEL_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5-coder:32b
OLLAMA_BASE_URL=http://localhost:11434
```

### Pattern D: Production API
**Best Setup**: Ollama Turbo for reliability
```bash
MODEL_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_API_KEY=your-turbo-key
OLLAMA_TEMPERATURE=0.0  # Deterministic
```

---

## Part 13: Cost Analysis

### Ollama Turbo Pricing (as of Sept 2025)
- **Subscription**: $20/month
- **Usage**: Subject to hourly/daily caps
- **Rate Limits**: Check current limits at https://ollama.com/turbo#faq

### Cost Comparison (Example: 1000 Research Queries)

| Provider | Model | Estimated Cost | Notes |
|----------|-------|---------------|-------|
| Local Ollama | Any local model | $0 (electricity only) | Requires capable hardware |
| Ollama Turbo | gpt-oss:120b-cloud | $20/mo (unlimited within caps) | Fixed monthly cost |
| Anthropic | Claude Sonnet 4 | ~$30-100 | Pay per token, varies by usage |

---

## Part 14: Security Best Practices

### Protecting API Keys

**DO**:
- ✅ Store keys in `.env` file (never commit to git)
- ✅ Add `.env` to `.gitignore`
- ✅ Use environment variables in production
- ✅ Rotate keys periodically
- ✅ Use different keys for dev/staging/prod

**DON'T**:
- ❌ Hardcode keys in source code
- ❌ Commit `.env` to version control
- ❌ Share keys in documentation or examples
- ❌ Use production keys in development

### Example `.gitignore` Entry
```
# Environment variables
.env
.env.local
.env.*.local

# API keys
*.key
secrets/
```

---

## Part 15: Integration with Existing Code

### If You Already Have This Pattern:

```python
# OLD: Hardcoded Claude
from langchain_anthropic import ChatAnthropic
model = ChatAnthropic(model_name="claude-sonnet-4-20250514", max_tokens=64000)
```

### Replace With:

```python
# NEW: Environment-controlled
from your_package.model import get_default_model
model = get_default_model()  # Reads from .env, can be Ollama or Claude
```

### If You Have Agent Builders:

```python
# OLD: No model parameter or hardcoded
def create_my_agent(tools, instructions):
    model = ChatAnthropic(...)  # Hardcoded
    return create_react_agent(model, tools, instructions)

# NEW: Configurable via env
def create_my_agent(tools, instructions, model=None):
    if model is None:
        model = get_default_model()  # Uses .env configuration
    return create_react_agent(model, tools, instructions)
```

---

## Part 16: Verification Steps

After implementation, verify everything works:

### Step 1: Environment Check
```bash
# Check .env file exists and has required vars
cd your-langgraph-project/
ls -la .env
grep MODEL_PROVIDER .env
grep OLLAMA .env
```

### Step 2: Package Check
```bash
# Verify packages installed
pip list | grep langchain-ollama
pip list | grep ollama

# Should show:
# langchain-ollama    0.3.8 (or higher)
# ollama              0.1.34 (or higher)
```

### Step 3: Ollama Check (for Turbo)
```bash
# Test Turbo endpoint directly
curl -H "Authorization: Bearer your-api-key" \
     https://ollama.com/api/tags

# Should return list of available models
```

### Step 4: Code Check
```python
# test_model_config.py
from your_package.model import get_default_model

model = get_default_model()
print(f"Model type: {type(model)}")
print(f"Model: {model}")

response = model.invoke("Say hello")
print(f"Response: {response.content}")
```

### Step 5: LangGraph Integration Check
```bash
# Start server with verbose logging
langgraph dev --port 4302

# Look for initialization logs:
# 🚀 Initializing Ollama (authenticated): gpt-oss:120b-cloud
#    - Endpoint: https://ollama.com
#    - Auth: Enabled
```

---

## Part 17: Common Mistakes to Avoid

### Mistake 1: Wrong Model Name Format
❌ **Wrong**: `OLLAMA_MODEL=gpt-oss-120b-cloud` (dash instead of colon)
✅ **Correct**: `OLLAMA_MODEL=gpt-oss:120b-cloud`

### Mistake 2: Missing -cloud Suffix for Turbo
❌ **Wrong**: `OLLAMA_MODEL=gpt-oss:120b` (trying to use Turbo model locally)
✅ **Correct**: `OLLAMA_MODEL=gpt-oss:120b-cloud`

### Mistake 3: Wrong Endpoint for Turbo
❌ **Wrong**: `OLLAMA_BASE_URL=http://ollama.com` (http not https)
✅ **Correct**: `OLLAMA_BASE_URL=https://ollama.com`

### Mistake 4: API Key Not Set
❌ **Wrong**: Using Turbo model without API key
✅ **Correct**: Set `OLLAMA_API_KEY` when using cloud models

### Mistake 5: Not Restarting Server
❌ **Wrong**: Changing `.env` but not restarting `langgraph dev`
✅ **Correct**: Restart server after `.env` changes to reload variables

---

## Part 18: Quick Reference Card

### Ollama Turbo Setup (Copy-Paste)
```bash
# In .env file:
MODEL_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b-cloud
OLLAMA_BASE_URL=https://ollama.com
OLLAMA_API_KEY=<get-from-ollama.com/account>
```

### Local Ollama Setup (Copy-Paste)
```bash
# In .env file:
MODEL_PROVIDER=ollama
OLLAMA_MODEL=llama3.1
OLLAMA_BASE_URL=http://localhost:11434

# In terminal:
ollama pull llama3.1
```

### Switch Back to Anthropic (Copy-Paste)
```bash
# In .env file:
MODEL_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-existing-key
```

---

## Part 19: Support Resources

### Getting Ollama Turbo API Key
1. Go to: https://ollama.com/turbo
2. Sign in or create account
3. Subscribe to Turbo ($20/month)
4. Go to: https://ollama.com/account
5. Click: API → Create new key
6. Copy key and add to `.env` file

### Documentation Links
- **Ollama Turbo**: https://ollama.com/turbo
- **Cloud Models**: https://ollama.com/cloud
- **API Documentation**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **LangChain Ollama**: https://python.langchain.com/docs/integrations/chat/ollama
- **LangGraph**: https://langchain-ai.github.io/langgraph/

### Community Resources
- **Ollama Discord**: https://discord.gg/ollama
- **LangChain Discord**: https://discord.gg/langchain
- **GitHub Issues**: https://github.com/ollama/ollama/issues

---

## Part 20: Summary for AI Agents

**If you're an AI agent implementing this:**

1. **Copy the `model.py` code** from Part 3 into your project
2. **Add dependencies** from Part 4 to your project's dependency file
3. **Update `.env`** with configuration from Part 5 (ask user for their API key)
4. **Find and replace** hardcoded model creation with `get_default_model()`
5. **Test** using verification steps from Part 7
6. **Document** what you changed for the user

**Key Points**:
- The code in Part 3 is production-ready - use it as-is
- All configuration happens via `.env` - no code changes needed after initial setup
- Clear error messages guide users when something is misconfigured
- Supports local Ollama, Ollama Turbo, Anthropic, and custom deployments
- Per-agent customization allows mixing providers/models

**What to Ask the User**:
1. Their Ollama Turbo API key (if using Turbo)
2. Which model they want as default (show options)
3. Whether they want per-agent customization (most don't need it)

**What NOT to Ask**:
- Implementation details (code is provided)
- How to structure the code (already defined)
- Technical decisions (guide covers all options)

---

## Version History

- **v1.0 (Oct 2025)**: Initial guide based on langchain-ollama 0.3.8 and Ollama Turbo preview
- **Updated for**: Python 3.11+, LangChain 2.5.0, LangGraph 0.2.6+

---

**End of Guide**

This document contains everything needed to implement Ollama Turbo in any LangGraph project. Share it with any AI agent working on LangGraph integration and they'll have complete context to implement it correctly.

