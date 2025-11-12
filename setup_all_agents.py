#!/usr/bin/env python3
"""
Open Agent Platform - Complete Agent Setup Script
=================================================

This script sets up ALL LangGraph agents for use with Open Agent Platform:
1. Copies Supabase authentication handlers to agents that need them
2. Updates langgraph.json files with auth configuration
3. Creates .env templates with Supabase configuration
4. Verifies all repositories are present

Run this ONCE after cloning all agent repositories.
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, List

# Base paths
REPOS_DIR = Path("/mnt/c/00_ConceptV/06_Project_Vi/repos")
OAP_DIR = REPOS_DIR / "open-agent-platform"

# Auth template source
AUTH_TEMPLATE_SOURCE = REPOS_DIR / "oap-langgraph-tools-agent" / "tools_agent" / "security" / "auth.py"

# Agents that need auth added
AGENTS_NEEDING_AUTH = [
    {
        "name": "multi-modal-researcher",
        "path": REPOS_DIR / "multi-modal-researcher",
        "auth_dest": "security/auth.py",
        "langgraph_json": "langgraph.json",
    },
    {
        "name": "langgraph-app-example",
        "path": REPOS_DIR / "langgraph-app-example",
        "auth_dest": "src/security/auth.py",
        "langgraph_json": "langgraph.json",
    },
]

# Auth check for existing agents
AGENTS_WITH_AUTH = [
    {
        "name": "oap-langgraph-tools-agent",
        "path": REPOS_DIR / "oap-langgraph-tools-agent",
        "auth_path": "tools_agent/security/auth.py",
    },
    {
        "name": "oap-agent-supervisor",
        "path": REPOS_DIR / "oap-agent-supervisor",
        "auth_path": "oap_supervisor/security/auth.py",
    },
    {
        "name": "open_deep_research",
        "path": REPOS_DIR / "open_deep_research",
        "auth_path": "src/security/auth.py",
    },
]

SUPABASE_ENV_TEMPLATE = """
# Supabase Authentication (required for OAP integration)
SUPABASE_URL="https://gctunhsuwpaxeatwlmuv.supabase.co"
SUPABASE_KEY="your-supabase-service-role-key-here"
"""


def print_header(text: str):
    """Print a formatted header."""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")


def print_step(step: int, text: str):
    """Print a step message."""
    print(f"[Step {step}] {text}")


def print_success(text: str):
    """Print a success message."""
    print(f"✅ {text}")


def print_error(text: str):
    """Print an error message."""
    print(f"❌ {text}")


def print_warning(text: str):
    """Print a warning message."""
    print(f"⚠️  {text}")


def check_repository_exists(agent: Dict) -> bool:
    """Check if agent repository exists."""
    if not agent["path"].exists():
        print_error(f"Repository not found: {agent['name']} at {agent['path']}")
        return False
    print_success(f"Found: {agent['name']}")
    return True


def copy_auth_handler(agent: Dict) -> bool:
    """Copy authentication handler to agent."""
    try:
        # Create directory if needed
        auth_file = agent["path"] / agent["auth_dest"]
        auth_file.parent.mkdir(parents=True, exist_ok=True)

        # Create __init__.py files for Python packages
        init_file = auth_file.parent / "__init__.py"
        if not init_file.exists():
            init_file.touch()
            print_success(f"Created {init_file.relative_to(agent['path'])}")

        # Copy auth handler
        shutil.copy2(AUTH_TEMPLATE_SOURCE, auth_file)
        print_success(f"Copied auth handler to {agent['name']}")
        return True
    except Exception as e:
        print_error(f"Failed to copy auth handler to {agent['name']}: {e}")
        return False


def update_langgraph_json(agent: Dict) -> bool:
    """Update langgraph.json to include auth configuration."""
    try:
        langgraph_file = agent["path"] / agent["langgraph_json"]

        # Read existing config
        with open(langgraph_file, 'r') as f:
            config = json.load(f)

        # Add auth configuration
        auth_path = agent["auth_dest"].replace("\\", "/")
        auth_module = auth_path.replace("/", ".").replace(".py", "")

        config["auth"] = {
            "path": f"./{auth_path}:auth"
        }

        # Write updated config
        with open(langgraph_file, 'w') as f:
            json.dump(config, f, indent=2)

        print_success(f"Updated {agent['name']}/langgraph.json with auth config")
        return True
    except Exception as e:
        print_error(f"Failed to update langgraph.json for {agent['name']}: {e}")
        return False


def add_supabase_env(agent: Dict) -> bool:
    """Add Supabase configuration to .env or .env.example."""
    try:
        env_file = agent["path"] / ".env"
        env_example = agent["path"] / ".env.example"

        # Check if Supabase config already exists
        for file in [env_file, env_example]:
            if file.exists():
                with open(file, 'r') as f:
                    content = f.read()
                    if "SUPABASE_URL" in content:
                        print_warning(f"Supabase config already exists in {file.name}")
                        return True

        # Add to .env.example if it exists, otherwise create .env
        target = env_example if env_example.exists() else env_file

        with open(target, 'a') as f:
            f.write(SUPABASE_ENV_TEMPLATE)

        print_success(f"Added Supabase config to {agent['name']}/{target.name}")
        return True
    except Exception as e:
        print_error(f"Failed to add Supabase config to {agent['name']}: {e}")
        return False


def verify_existing_auth() -> List[Dict]:
    """Verify agents that already have auth handlers."""
    print_step("*", "Verifying agents with existing auth...")
    verified = []

    for agent in AGENTS_WITH_AUTH:
        if check_repository_exists(agent):
            auth_file = agent["path"] / agent["auth_path"]
            if auth_file.exists():
                print_success(f"{agent['name']} - Auth handler verified")
                verified.append(agent)
            else:
                print_warning(f"{agent['name']} - Auth handler missing at {agent['auth_path']}")

    return verified


def setup_new_auth() -> List[Dict]:
    """Set up auth for agents that don't have it."""
    print_step("*", "Setting up auth for agents without it...")
    setup_complete = []

    for agent in AGENTS_NEEDING_AUTH:
        print(f"\n  Setting up: {agent['name']}")

        if not check_repository_exists(agent):
            continue

        success = True
        success = copy_auth_handler(agent) and success
        success = update_langgraph_json(agent) and success
        success = add_supabase_env(agent) and success

        if success:
            setup_complete.append(agent)
            print_success(f"✓ {agent['name']} setup complete")
        else:
            print_error(f"✗ {agent['name']} setup incomplete")

    return setup_complete


def create_summary() -> str:
    """Create a summary of the setup."""
    summary = """
╔══════════════════════════════════════════════════════════════╗
║                      SETUP COMPLETE                           ║
╚══════════════════════════════════════════════════════════════╝

Next Steps:
-----------

1. Configure Supabase in each agent's .env file:

   SUPABASE_URL="https://gctunhsuwpaxeatwlmuv.supabase.co"
   SUPABASE_KEY="<your-service-role-key>"

2. Add other required API keys to each .env:
   - OPENAI_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_API_KEY
   - TAVILY_API_KEY (for search agents)
   - GEMINI_API_KEY (for multi-modal researcher)

3. Start all agents:

   python launch_all_agents.py

4. Access Open Agent Platform:

   http://localhost:3003

For detailed information, see:
- LANGGRAPH_AGENTS_REGISTRY.md
- QUICK_START_GUIDE.md

"""
    return summary


def main():
    """Main setup routine."""
    print_header("Open Agent Platform - Complete Agent Setup")

    # Check if auth template exists
    if not AUTH_TEMPLATE_SOURCE.exists():
        print_error(f"Auth template not found at {AUTH_TEMPLATE_SOURCE}")
        print_error("Please ensure oap-langgraph-tools-agent repository exists.")
        return 1

    print_success("Auth template found")

    # Verify existing auth
    verified = verify_existing_auth()

    # Setup new auth
    setup_complete = setup_new_auth()

    # Print summary
    print(create_summary())

    print(f"✅ Setup complete!")
    print(f"   - {len(verified)} agents verified with existing auth")
    print(f"   - {len(setup_complete)} agents configured with new auth")
    print(f"   - Total agents ready: {len(verified) + len(setup_complete)}")

    return 0


if __name__ == "__main__":
    exit(main())