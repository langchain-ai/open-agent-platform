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
import { Agent, AgentConfigType } from "@/types/agent";
import { Deployment } from "@/types/deployment";
import {
  groupAgentsByGraphs,
  isSystemCreatedDefaultAssistant,
} from "@/lib/agent-utils";
import { createClient } from "@/lib/client";
import { useAuthContext } from "./Auth";
import { toast } from "sonner";
import { Assistant } from "@langchain/langgraph-sdk";
import { getApiUrl } from "@/lib/api-url";

async function getOrCreateDefaultAssistants(
  deployment: Deployment,
  accessToken?: string,
): Promise<Assistant[]> {
  const baseApiUrl = getApiUrl();

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

export async function getAgents(
  deployments: Deployment[],
  accessToken: string,
): Promise<Agent[]> {
  const agentsPromise: Promise<Agent[]>[] = deployments.map(
    async (deployment) => {
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

      return assistantsGroupedByGraphs
        .map((group) => {
          return group.map((assistant) => ({
            ...assistant,
            deploymentId: deployment.id,
            supportedConfigs: [
              "tools",
              "deep_agent",
              "triggers",
            ] as AgentConfigType[],
          }));
        })
        .flat();
    },
  );

  return (await Promise.all(agentsPromise)).flat();
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

type AgentsProviderProps = {
  children: ReactNode;
  initialAgents?: Agent[];
};

export const AgentsProvider: React.FC<AgentsProviderProps> = ({
  children,
  initialAgents,
}) => {
  const { session } = useAuthContext();
  const deployments = getDeployments();

  const [agents, setAgents] = useState<Agent[]>(initialAgents ?? []);
  const [loading, setLoading] = useState(false);
  const [refreshAgentsLoading, setRefreshAgentsLoading] = useState(false);

  const firstRequestMade = useRef(false);

  useEffect(() => {
    if (firstRequestMade.current) return;
    if (initialAgents && initialAgents.length > 0) {
      // When initialAgents are provided (e.g., from AgentsLibrary), we should:
      // 1. Use them as the initial state instead of making a duplicate API call
      // 2. Filter out system-created default assistants to maintain consistency
      // 3. Mark firstRequestMade as true to prevent the useEffect from triggering
      //    another fetch when the component mounts
      firstRequestMade.current = true;
      setAgents(
        initialAgents.filter((a) => !isSystemCreatedDefaultAssistant(a)),
      );
      return;
    }
    if (agents.length > 0 || !session?.accessToken) return;

    firstRequestMade.current = true;
    setLoading(true);
    getAgents(deployments, session.accessToken)
      // Never expose the system created default assistants to the user
      .then((a) =>
        setAgents(a.filter((a) => !isSystemCreatedDefaultAssistant(a))),
      )
      .finally(() => setLoading(false));
  }, [session?.accessToken, initialAgents]);

  async function refreshAgents() {
    if (!session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }
    try {
      setRefreshAgentsLoading(true);
      const newAgents = await getAgents(deployments, session.accessToken);
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
