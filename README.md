# Open Agent Platform

Open Agent Platform is a no-code agent building platform. These agents can be connected to a wide range of tools, RAG servers, and even other agents through an Agent Supervisor!

<video src="https://github.com/user-attachments/assets/bc91304b-e704-41d7-a0cd-9806d37640c0.mp4" controls="controls"></video>

## Overview

Open Agent Platform provides a modern, web-based interface for creating, managing, and interacting with LangGraph agents. It's designed with simplicity in mind, making it accessible to users without technical expertise, while still offering advanced capabilities for developers.

## Key Features

- **Agent Management**: Build, configure, and interact with agents through an intuitive interface.
- **RAG Integration**: First-class support for Retrieval Augmented Generation with [LangConnect](https://github.com/langchain-ai/langconnect).
- **MCP Tools**: Connect your agents to external tools through MCP servers.
- **Agent Supervision**: Orchestrate multiple agents working together through an Agent Supervisor.
- **Authentication**: Built-in authentication and access control.
- **Configurable Agents**: Easily define how users can configure your agents through a rich UI.

## Documentation

For detailed setup instructions, guides, and API references, please visit our **[full documentation site](https://docs.oap.langchain.com)**.

## Getting Started

To quickly get started with Open Agent Platform, check out the [Quickstart Guide](https://docs.oap.langchain.com/quickstart) in our documentation.

## Community and Support

- **GitHub Issues**: Report bugs or request features [here](https://github.com/langchain-ai/open-agent-platform/issues).
- **Discussions**: Join the conversation on our [GitHub Discussions page](https://github.com/langchain-ai/open-agent-platform/discussions).

We encourage you to explore the platform, build your own agents, and contribute to the Open Agent Platform community!

# Concepts/FAQ

## Concepts

### Agents

An agent is a custom configuration on-top of an existing LangGraph graph. This is the same concept as an `assistant`, in the LangGraph API.

## FAQ

### Do I need a backend server?

OAP does not require a standalone backend server to be running in order for the web app to work. As long as you've added deployments from LangGraph Platform to your instance, it should work as expected!

However, if you want to use the RAG features, you will need to have the LangConnect server running on its own. This is because the LangConnect RAG server is intended to be hosted independently from your LangGraph deployments. See the [LangConnect docs](https://github.com/langchain-ai/langconnect/blob/main/README.md) for more information.

### How can I build my own agents?

Yes! See the [Building Your Own Agents](https://docs.oap.langchain.com/custom-agents/overview#building-your-own-agents) section for more information.

### How can I use non-supabase auth?

Yes! It requires some modifications to be made to the code, but we've implemented authentication in a way which makes it easy to swap out with any other authentication provider. 

### How can I use non-langgraph agents?

No. All agents you intend to use with OAP must be LangGraph agents, deployed on LangGraph Platform.

### Why is my agent's config only showing string inputs, and not custom fields?

First, ensure you're using the latest version of LangGraph. If running locally, make sure you're using the latest version of the LangGraph API, and CLI packages. If deploying, make sure you've published a revision after 05/14/2025. Then, check that you have the `x_oap_ui_config` metadata set on your configurable fields. If you have, check that your configurable object is defined using LangGraph Zod (if using TypeScript), as this is required for the Open Agent Platform to recognize & render your UI fields.

If it's still not working, confirm your `x_oap_ui_config` metadata has the proper fields set.

## Docker Compose Deployment

The repository includes a `Dockerfile` and `docker-compose.yml` to run the web application and a DragonflyDB (Redis-compatible in-memory database) service in containers.

### Local Development

For local development using Docker Compose:

1.  **Copy Environment File:** Create a local environment file by copying `apps/web/.env.example` to `apps/web/.env`.
    ```bash
    cp apps/web/.env.example apps/web/.env
    ```
2.  **Configure Variables:** Edit `apps/web/.env` and fill in your local development values. Key variables include:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project anon key.
    *   `NEXT_PUBLIC_DEPLOYMENTS`: Configuration for your LangGraph deployments (see example in `.env.example`).
    *   `DRAGONFLYDB_HOST`: For local Docker Compose, this should be `dragonflydb` (the service name defined in `docker-compose.yml`).
    *   `DRAGONFLYDB_PORT`: Defaults to `6379`.
3.  **Start Services:**
    ```bash
    docker-compose up --build
    ```
    The web application will be available at [http://localhost:3000](http://localhost:3000).

### Deployment with Coolify (or similar platforms)

When deploying to a platform like Coolify:

*   **Environment Variables:** Configure the environment variables directly in your Coolify project's settings/dashboard. Refer to `apps/web/.env.example` for the full list of required variables and their purpose. Essential variables include:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `NEXT_PUBLIC_DEPLOYMENTS`
    *   `DRAGONFLYDB_HOST` (Coolify will typically make the DragonflyDB service available via its service name, e.g., `dragonflydb`, or provide a specific connection string)
    *   `DRAGONFLYDB_PORT` (usually `6379`)
    *   `DRAGONFLYDB_PASSWORD` (if you've configured one for DragonflyDB)
*   **Service Discovery:** Coolify will manage the Docker Compose services, including networking between the `web` app and `dragonflydb`. You generally do not need to manually create the `.env` file on the server if using a platform like Coolify that injects environment variables.
