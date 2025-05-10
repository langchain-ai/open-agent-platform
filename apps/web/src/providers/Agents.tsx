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
import { isDefaultAssistant } from "@/lib/agent-utils";
import { useAgents } from "@/hooks/use-agents";
import { extractConfigurationsFromAgent } from "@/lib/ui-config";
import { createClient } from "@/lib/client";
import { useAuthContext } from "./Auth";
import { toast } from "sonner";
import { Client } from "@langchain/langgraph-sdk";

async function createDefaultAssistant(client: Client) {
  if (!process.env.NEXT_PUBLIC_DEFAULT_GRAPH_NAME) {
    throw new Error(
      "Default graph name not found. Please ensure the environment variable NEXT_PUBLIC_DEFAULT_GRAPH_NAME is set.",
    );
  }
  try {
    const assistant = await client.assistants.create({
      graphId: process.env.NEXT_PUBLIC_DEFAULT_GRAPH_NAME,
      name: "Default Assistant",
      metadata: {
        description: "Default Assistant",
        _x_oap_is_default: true,
      },
    });
    return assistant;
  } catch (e) {
    console.error("Failed to create default assistant", e);
    toast.error("Failed to create default assistant");
    return undefined;
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
      const client = createClient(deployment.id, accessToken);

      const assistants = await client.assistants.search({
        limit: 100,
      });
      if (!assistants.length) {
        const defaultAssistant = await createDefaultAssistant(client);
        if (!defaultAssistant) {
          return [];
        }
        assistants.push(defaultAssistant);
      }
      const defaultAssistant =
        assistants.find((a) => isDefaultAssistant(a as Agent)) ?? assistants[0];
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

      return assistants.map((assistant) => ({
        ...assistant,
        deploymentId: deployment.id,
        supportedConfigs: supportedConfigs as ["tools" | "rag" | "supervisor"],
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
      .then(setAgents)
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
      setAgents(newAgents);
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
