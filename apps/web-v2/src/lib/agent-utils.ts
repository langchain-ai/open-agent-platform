import { Agent, AgentConfigType } from "@/types/agent";
import { getDeployments } from "./environment/deployments";
import { Assistant } from "@langchain/langgraph-sdk";
import { Deployment } from "@/types/deployment";

/**
 * Determines if an agent is the user's default agent.
 *
 * Each user gets their own default agent in a deployment since they cannot
 * access the system-created default agent. This function checks if the given
 * agent has been marked as a user's default. This is NOT the primary agent
 * for the entire OAP deployment, but rather the default agent for a given graph.
 *
 * @param agent The agent to check
 * @returns True if the agent is a user's default agent
 */
export function isUserCreatedDefaultAssistant(
  agent: Agent | Assistant,
): boolean {
  return agent.metadata?._x_oap_is_default === true;
}

/**
 * Determines if an agent is a system-created default assistant.
 *
 * System-created default assistants are created by the platform itself
 * rather than by users. Each graph on a deployment will always have a single
 * default assistant, created by the platform. This function checks the agent's
 * metadata to determine its origin. These agents will only be accessible if using
 * admin auth (NEXT_PUBLIC_USE_LANGSMITH_AUTH="true").
 *
 * @param agent The agent to check
 * @returns True if the agent was created by the system
 */
export function isSystemCreatedDefaultAssistant(
  agent: Agent | Assistant,
): boolean {
  return agent.metadata?.created_by === "system";
}

/**
 * Determines if an agent is the primary assistant for a graph.
 *
 * A primary assistant is the default assistant for all graphs provided
 * to OAP. This can only be one agent, across all graphs & deployments,
 * and is specified by setting `isDefault: true` and `defaultGraphId`
 * on a deployment in the `NEXT_PUBLIC_DEPLOYMENTS` environment variable.
 *
 * @param agent The agent to check
 * @returns True if the agent is the primary assistant for a graph
 */
export function isPrimaryAssistant(agent: Agent | Assistant): boolean {
  return agent.metadata?._x_oap_is_primary === true;
}

export function isUserSpecifiedDefaultAgent(agent: Agent): boolean {
  const deployments = getDeployments();
  const defaultDeployment = deployments.find((d) => d.isDefault);
  if (!defaultDeployment) {
    return false;
  }
  return (
    isUserCreatedDefaultAssistant(agent) &&
    isDefaultGraph(defaultDeployment, agent.graph_id) &&
    agent.deploymentId === defaultDeployment.id
  );
}

/**
 * Sorts an array of agents within a group.
 * The default agent comes first, followed by others sorted by `updated_at` descending.
 * @param agentGroup An array of agents belonging to the same group.
 * @returns A new array with the sorted agents.
 */
export function sortAgentGroup(agentGroup: Agent[]): Agent[] {
  return [...agentGroup].sort((a, b) => {
    const aIsDefault = isUserCreatedDefaultAssistant(a);
    const bIsDefault = isUserCreatedDefaultAssistant(b);

    if (aIsDefault && !bIsDefault) {
      return -1; // a comes first
    }
    if (!aIsDefault && bIsDefault) {
      return 1; // b comes first
    }

    // If both are default or both are not, sort by updated_at descending
    // Handle potential missing or invalid dates gracefully
    const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    const validTimeA = !isNaN(timeA) ? timeA : 0;
    const validTimeB = !isNaN(timeB) ? timeB : 0;

    return validTimeB - validTimeA; // Newest first
  });
}

/**
 * Groups an array of agents by their `graph_id`.
 * @param agents An array of agents.
 * @returns An array of arrays, where each inner array contains agents belonging to the same graph.
 */
export function groupAgentsByGraphs<AgentOrAssistant extends Agent | Assistant>(
  agents: AgentOrAssistant[],
): AgentOrAssistant[][] {
  return Object.values(
    agents.reduce<Record<string, AgentOrAssistant[]>>((acc, agent) => {
      const groupId = agent.graph_id;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(agent);
      return acc;
    }, {}),
  );
}

/**
 * Determines if a graph is the default graph for a deployment.
 * @param deployment The deployment to check.
 * @param graphId The graph ID to check.
 * @returns True if the graph is the default graph for the deployment.
 */
export function isDefaultGraph(
  deployment: Deployment,
  graphId: string,
): boolean {
  return deployment.graphs.find((g) => g.isDefault)?.id === graphId;
}

/**
 * Analyzes an agent's configuration to determine what features it actually supports.
 * @param agent The agent to analyze
 * @param agentIdsWithTriggers Optional set of agent IDs that have triggers configured
 * @returns Array of supported configuration types
 */
export function detectSupportedConfigs(
  agent: Agent | Assistant,
  agentIdsWithTriggers?: Set<string>,
): AgentConfigType[] {
  const supportedConfigs: AgentConfigType[] = [];
  const configurable = agent.config?.configurable;

  if (!configurable) {
    // Still check for triggers even if no configurable data
    if (agentIdsWithTriggers?.has(agent.assistant_id)) {
      supportedConfigs.push("triggers");
    }
    return supportedConfigs;
  }

  // Check for tools configuration
  if (
    configurable.tools &&
    typeof configurable.tools === "object" &&
    "tools" in configurable.tools &&
    Array.isArray(configurable.tools.tools) &&
    configurable.tools.tools.length > 0
  ) {
    supportedConfigs.push("tools");
  }

  // Check for sub-agents configuration
  if (
    configurable.subagents &&
    Array.isArray(configurable.subagents) &&
    configurable.subagents.length > 0
  ) {
    supportedConfigs.push("subagents");
  }

  // Check for triggers
  if (agentIdsWithTriggers?.has(agent.assistant_id)) {
    supportedConfigs.push("triggers");
  }

  return supportedConfigs;
}
