import "dotenv/config";
import { Assistant, Client } from "@langchain/langgraph-sdk";

async function main() {
  const deploymentUrl = "";
  const newMCPUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL;
  if (!newMCPUrl) {
    throw new Error("MCP URL env variable is not set");
  }

  const client = new Client({
    apiUrl: deploymentUrl,
    apiKey: process.env.LANGSMITH_API_KEY,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });

  // Collect all agents using pagination
  const allAgents: Assistant[] = [];
  const pageSize = 100;
  let hasMore = true;
  let offset = 0;

  // Continue fetching until there are no more pages
  while (hasMore) {
    const agents = await client.assistants.search({
      limit: pageSize,
      offset,
    });

    // Add the current page of agents to our collection
    if (agents.length === 0) {
      hasMore = false;
    } else {
      allAgents.push(...agents);
      offset += pageSize;
    }
  }

  console.log("allAgents", allAgents.length);

  const agentsUpdatePromise = allAgents.map(async (agent) => {
    if (!agent.config?.configurable || !agent.config?.configurable.tools) {
      return;
    }
    return await client.assistants.update(agent.assistant_id, {
      config: {
        configurable: {
          ...agent.config.configurable,
          tools: {
            ...agent.config.configurable.tools,
            url: newMCPUrl,
          },
        },
      },
    });
  });
  const updatedAgents = await Promise.all(agentsUpdatePromise);

  console.log("updated", updatedAgents.length);
}

main().catch(console.error);
