"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
import { getDeployments } from "@/lib/environment/deployments";
import { Agent } from "@/types/agent";
import { Deployment } from "@/types/deployment";
import {
  groupAgentsByGraphs,
  isSystemCreatedDefaultAssistant,
  isUserCreatedDefaultAssistant,
} from "@/lib/agent-utils";
import { useAgents } from "@/hooks/use-agents";
import { extractConfigurationsFromAgent } from "@/lib/ui-config";
import { createClient } from "@/lib/client";
import { useAuthContext } from "./Auth";
import { toast } from "sonner";
import { Assistant } from "@langchain/langgraph-sdk";

async function getOrCreateDefaultAssistants(
  deployment: Deployment,
  accessToken?: string,
): Promise<Assistant[]> {
  const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
  if (!baseApiUrl) {
    throw new Error(
      "Failed to get default assistants: Base API URL not configured. Please set NEXT_PUBLIC_BASE_API_URL",
    );
  }

  try {
    const url = `${baseApiUrl}/langgraph/defaults?deploymentId=${deployment.id}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get default assistants: ${response.status} ${response.statusText} ${errorData.error || ""}`,
      );
    }

    const defaultAssistants = await response.json();
    return defaultAssistants;
  } catch (error) {
    console.error("Error getting default assistants:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function getAgents(
  deployments: Deployment[],
  accessToken: string,
  getAgentConfigSchema: (
    agentId: string,
    deploymentId: string,
  ) => Promise<Record<string, any> | undefined>,
): Promise<Agent[]> {
  const agentsPromise: Promise<Agent[]>[] = deployments.map(
    async (deployment) => {
      try {
        const client = createClient(deployment.id, accessToken);

        const [defaultAssistants, allUserAssistants] = await Promise.all([
          getOrCreateDefaultAssistants(deployment, accessToken),
          client.assistants.search({
            limit: 100,
          }),
        ]);
        const assistantMap = new Map<string, Assistant>();

        // Add default assistants to the map
        defaultAssistants.forEach((assistant) => {
          assistantMap.set(assistant.assistant_id, assistant);
        });

        // Add user assistants to the map, potentially overriding defaults
        allUserAssistants.forEach((assistant) => {
          assistantMap.set(assistant.assistant_id, assistant);
        });

        // Convert map values back to array
        const allAssistants: Assistant[] = Array.from(assistantMap.values());

        const assistantsGroupedByGraphs = groupAgentsByGraphs(allAssistants);

        const assistantsPromise: Promise<Agent[]>[] =
          assistantsGroupedByGraphs.map(async (group) => {
            // We must get the agent config schema for each graph in a deployment,
            // not just for each deployment, as a deployment can have multiple graphs
            // each with their own unique config schema.
            const defaultAssistant =
              group.find((a) => isUserCreatedDefaultAssistant(a)) ?? group[0];
            const schema = await getAgentConfigSchema(
              defaultAssistant.assistant_id,
              deployment.id,
            );

            const supportedConfigs: string[] = [];
            if (schema) {
              const { toolConfig, ragConfig, agentsConfig } =
                extractConfigurationsFromAgent({
                  agent: defaultAssistant,
                  schema,
                });
              if (toolConfig.length) {
                supportedConfigs.push("tools");
              }
              if (ragConfig.length) {
                supportedConfigs.push("rag");
              }
              if (agentsConfig.length) {
                supportedConfigs.push("supervisor");
              }
            }

            return group.map((assistant) => ({
              ...assistant,
              deploymentId: deployment.id,
              supportedConfigs: supportedConfigs as [
                "tools" | "rag" | "supervisor",
              ],
            }));
          });

        return (await Promise.all(assistantsPromise)).flat();
      } catch (error) {
        console.error(
          `Failed to load agents from deployment ${deployment.name} (${deployment.id}):`,
          error,
        );
        // Return empty array for this deployment so other deployments can still load
        return [];
      }
    },
  );

  // Use Promise.allSettled to ensure all deployments are attempted
  // even if some fail, so working agents still show up
  const results = await Promise.allSettled(agentsPromise);
  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .flat();
}

type AgentsContextType = {
  /**
   * A two-dimensional array of agents.
   * Each subarray contains the agents for a specific deployment.
   */
  agents: Agent[];
  /**
   * Refreshes the agents list by fetching the latest agents from the API,
   * and updating the state.
   */
  refreshAgents: () => Promise<void>;
  /**
   * Whether the agents list is currently loading.
   */
  loading: boolean;
  /**
   * Whether the agents list is currently loading.
   */
  refreshAgentsLoading: boolean;
};
const AgentsContext = createContext<AgentsContextType | undefined>(undefined);

export const AgentsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { session } = useAuthContext();
  const agentsState = useAgents();
  const deployments = getDeployments();
  const [agents, setAgents] = useState<Agent[]>([]);
  const firstRequestMade = useRef(false);
  const [loading, setLoading] = useState(false);
  const [refreshAgentsLoading, setRefreshAgentsLoading] = useState(false);

  useEffect(() => {
    if (agents.length > 0 || firstRequestMade.current || !session?.accessToken)
      return;

    firstRequestMade.current = true;
    setLoading(true);
    getAgents(
      deployments,
      session.accessToken,
      agentsState.getAgentConfigSchema,
    )
      // Never expose the system created default assistants to the user
      .then((a) =>
        setAgents(a.filter((a) => !isSystemCreatedDefaultAssistant(a))),
      )
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  async function refreshAgents() {
    if (!session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }
    try {
      setRefreshAgentsLoading(true);
      const newAgents = await getAgents(
        deployments,
        session.accessToken,
        agentsState.getAgentConfigSchema,
      );
      setAgents(newAgents.filter((a) => !isSystemCreatedDefaultAssistant(a)));
    } catch (e) {
      console.error("Failed to refresh agents", e);
    } finally {
      setRefreshAgentsLoading(false);
    }
  }

  const agentsContextValue = {
    agents,
    loading,
    refreshAgents,
    refreshAgentsLoading,
  };

  return (
    <AgentsContext.Provider value={agentsContextValue}>
      {children}
    </AgentsContext.Provider>
  );
};

// Create a custom hook to use the context
export const useAgentsContext = (): AgentsContextType => {
  const context = useContext(AgentsContext);
  if (context === undefined) {
    throw new Error("useAgentsContext must be used within a StreamProvider");
  }
  return context;
};

export default AgentsContext;
