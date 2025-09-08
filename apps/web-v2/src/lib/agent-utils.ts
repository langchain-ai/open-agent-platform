import { Agent } from "@/types/agent";
import { getDeployments } from "./environment/deployments";
import { Assistant } from "@langchain/langgraph-sdk";
import { toast } from "sonner";
import React from "react";

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
    agent.graph_id === defaultDeployment.defaultGraphId &&
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
 * Checks if API keys are required but not set for a deployment.
 * @param deploymentId The deployment ID to check
 * @param hasApiKeys Whether the user has API keys set
 * @returns True if the deployment requires API keys but user doesn't have them
 */
export function requiresApiKeysButNotSet(
  deploymentId: string,
  hasApiKeys: boolean,
): boolean {
  const deployment = getDeployments().find((d) => d.id === deploymentId);
  return deployment?.requiresApiKeys === true && !hasApiKeys;
}

/**
 * Shows a warning toast if API keys are required but not set.
 * @param deploymentId The deployment ID to check
 * @param hasApiKeys Whether the user has API keys set
 */
export function checkApiKeysWarning(deploymentId: string, hasApiKeys: boolean) {
  if (requiresApiKeysButNotSet(deploymentId, hasApiKeys)) {
    const deployment = getDeployments().find((d) => d.id === deploymentId);
    const baseMessage =
      "This agent requires all necessary API keys to be set in the Settings page under your Account.";

    const customMessage = deployment?.apiKeysRequiredMessage;
    const fullMessage = customMessage
      ? `${baseMessage}\n\n${customMessage}`
      : baseMessage;

    toast.error(
      React.createElement(
        "div",
        { className: "space-y-2" },
        React.createElement("p", null, fullMessage),
        React.createElement(
          "a",
          {
            href: "/settings",
            className:
              "inline-flex items-center text-sm font-bold hover:text-red-900 underline",
          },
          "Go to Settings →",
        ),
      ),
      {
        duration: 60000,
        richColors: true,
        closeButton: false,
      },
    );
  }
}
