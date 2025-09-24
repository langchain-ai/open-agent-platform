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
  isSystemCreatedDefaultAssistant,
  detectSupportedConfigs,
} from "@/lib/agent-utils";
import { createClient } from "@/lib/client";
import { useAuthContext } from "./Auth";
import { toast } from "sonner";

async function getAgents(
  deployments: Deployment[],
  accessToken: string,
): Promise<Agent[]> {
  const agentsPromise: Promise<Agent[]>[] = deployments.map(
    async (deployment) => {
      const client = createClient(deployment.id, accessToken);

      const allUserAssistants = await client.assistants.search({
        // Only search for a single graph for now
        graphId: deployment.graphs[0].id,
        limit: 100,
      });

      return allUserAssistants.map((a) => ({
        ...a,
        deploymentId: deployment.id,
        supportedConfigs: detectSupportedConfigs(a),
      }));
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
  refreshAgents: () => Promise<Agent[]>;
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
  const deployments = getDeployments();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshAgentsLoading, setRefreshAgentsLoading] = useState(false);

  const firstRequestMade = useRef(false);

  useEffect(() => {
    if (agents.length > 0 || firstRequestMade.current || !session?.accessToken)
      return;

    firstRequestMade.current = true;
    setLoading(true);
    getAgents(deployments, session.accessToken)
      // Never expose the system created default assistants to the user
      .then((a) =>
        setAgents(a.filter((a) => !isSystemCreatedDefaultAssistant(a))),
      )
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  async function refreshAgents(): Promise<Agent[]> {
    if (!session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return [];
    }
    try {
      setRefreshAgentsLoading(true);
      const newAgents = await getAgents(deployments, session.accessToken);
      const updatedAgentsList = newAgents.filter(
        (a) => !isSystemCreatedDefaultAssistant(a),
      );
      setAgents(updatedAgentsList);
      return updatedAgentsList;
    } catch (e) {
      console.error("Failed to refresh agents", e);
      return [];
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
