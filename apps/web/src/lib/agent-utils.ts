import { Agent } from "@/types/agent";

/**
 * Checks if an agent is the system-defined default assistant.
 * @param agent The agent to check.
 * @returns True if the agent is the default, false otherwise.
 */
export function isDefaultAssistant(agent: Agent): boolean {
  return agent.metadata?.created_by === "system";
}

export function isUserSpecifiedDefaultAgent(agent: Agent): boolean {
  const defaultGraphId = process.env.NEXT_PUBLIC_DEFAULT_GRAPH_ID;
  if (!defaultGraphId) {
    return false;
  }
  // The default agent is the default assistant on the graph specified by the user via env var
  return isDefaultAssistant(agent) && agent.assistant_id === defaultGraphId;
}

/**
 * Sorts an array of agents within a group.
 * The default agent comes first, followed by others sorted by `updated_at` descending.
 * @param agentGroup An array of agents belonging to the same group.
 * @returns A new array with the sorted agents.
 */
export function sortAgentGroup(agentGroup: Agent[]): Agent[] {
  return [...agentGroup].sort((a, b) => {
    const aIsDefault = isDefaultAssistant(a);
    const bIsDefault = isDefaultAssistant(b);

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
export function groupAgentsByGraphs(agents: Agent[]): Agent[][] {
  return Object.values(
    agents.reduce<Record<string, Agent[]>>((acc, agent) => {
      const groupId = agent.graph_id;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(agent);
      return acc;
    }, {}),
  );
}

export function getUserSpecifiedDefaultAgent(agents: Agent[]): Agent | null {
  const defaultGraphId = process.env.NEXT_PUBLIC_DEFAULT_GRAPH_ID;
  if (!defaultGraphId) {
    return null;
  }
  return agents.find(isUserSpecifiedDefaultAgent) ?? null;
}
