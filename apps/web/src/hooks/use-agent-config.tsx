import {
  ConfigurableFieldAgentsMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldUIMetadata,
} from "@/types/configurable";
import { useState } from "react";
import { useAgents } from "./use-agents";
import {
  configSchemaToAgentsConfig,
  configSchemaToConfigurableFields,
  configSchemaToConfigurableTools,
  configSchemaToRagConfig,
  extractConfigurationsFromAgent,
  getConfigurableDefaults,
} from "@/lib/ui-config";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { Agent } from "@/types/agent";

/**
 * A custom hook for managing and accessing the configurable
 * fields on an agent.
 */
export function useAgentConfig() {
  const { getAgentConfigSchema } = useAgents();

  const [configurations, setConfigurations] = useState<
    ConfigurableFieldUIMetadata[]
  >([]);
  const [toolConfigurations, setToolConfigurations] = useState<
    ConfigurableFieldMCPMetadata[]
  >([]);
  const [ragConfigurations, setRagConfigurations] = useState<
    ConfigurableFieldRAGMetadata[]
  >([]);
  const [agentsConfigurations, setAgentsConfigurations] = useState<
    ConfigurableFieldAgentsMetadata[]
  >([]);

  const [supportedConfigs, setSupportedConfigs] = useState<string[]>([]);

  // The raw configurable fields. Only contains key value pairs, and nothing
  // around the UI config.
  const [config, setConfig] = useState<Record<string, any>>({});

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const clearState = () => {
    setConfigurations([]);
    setToolConfigurations([]);
    setRagConfigurations([]);
    setAgentsConfigurations([]);
    setConfig({});
    setName("");
    setDescription("");
    setLoading(false);
  };

  const getSchemaAndUpdateConfig = async (
    agent: Agent,
    args?: {
      isCreate?: boolean;
    },
  ) => {
    clearState();

    setLoading(true);
    try {
      const schema = await getAgentConfigSchema(
        agent.assistant_id,
        agent.deploymentId,
      );
      if (!schema) return;
      const { configFields, toolConfig, ragConfig, agentsConfig } =
        extractConfigurationsFromAgent({
          agent,
          schema,
        });

      const agentId = agent.assistant_id;

      setConfigurations(configFields);
      setToolConfigurations(toolConfig);

      // Set default config values based on configuration fields
      const { setDefaultConfig } = useConfigStore.getState();
      setDefaultConfig(agentId, configFields);

      const supportedConfigs: string[] = [];

      if (toolConfig.length) {
        setDefaultConfig(`${agentId}:selected-tools`, toolConfig);
        setToolConfigurations(toolConfig);
        supportedConfigs.push("tools");
      }
      if (ragConfig.length) {
        setDefaultConfig(`${agentId}:rag`, ragConfig);
        setRagConfigurations(ragConfig);
        supportedConfigs.push("rag");
      }
      if (agentsConfig.length) {
        setDefaultConfig(`${agentId}:agents`, agentsConfig);
        setAgentsConfigurations(agentsConfig);
        supportedConfigs.push("supervisor");
      }

      if (!args?.isCreate) {
        // Don't set name/description for create agents, since these are user specified fields.
        setName(agent.name);
        setDescription((agent.metadata?.description ?? "") as string);
      }

      const configurableDefaults = getConfigurableDefaults(
        configFields,
        toolConfig,
        ragConfig,
        agentsConfig,
      );
      setConfig(configurableDefaults);
      setSupportedConfigs(supportedConfigs);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaultConfig = async (agent: Agent) => {
    const schema = await getAgentConfigSchema(
      agent.assistant_id,
      agent.deploymentId,
    );
    if (!schema) return;

    const agentId = agent.assistant_id;

    const configFields = configSchemaToConfigurableFields(schema);
    const toolConfig = configSchemaToConfigurableTools(schema);
    const ragConfig = configSchemaToRagConfig(schema);
    const agentsConfig = configSchemaToAgentsConfig(schema);
    const { setDefaultConfig } = useConfigStore.getState();
    setDefaultConfig(agentId, configFields);

    const supportedConfigs: string[] = [];

    if (toolConfig.length) {
      setDefaultConfig(`${agentId}:selected-tools`, toolConfig);
      setToolConfigurations(toolConfig);
      supportedConfigs.push("tools");
    }
    if (ragConfig) {
      setDefaultConfig(`${agentId}:rag`, [ragConfig]);
      setRagConfigurations([ragConfig]);
      supportedConfigs.push("rag");
    }
    if (agentsConfig) {
      setDefaultConfig(`${agentId}:agents`, [agentsConfig]);
      setAgentsConfigurations([agentsConfig]);
    }
    const configurableDefaults = getConfigurableDefaults(
      configFields,
      toolConfig,
      ragConfig ? [ragConfig] : [],
      agentsConfig ? [agentsConfig] : [],
    );
    setConfig(configurableDefaults);
  };

  return {
    clearState,
    resetToDefaultConfig,
    getSchemaAndUpdateConfig,
    configurations,
    setConfigurations,
    toolConfigurations,
    setToolConfigurations,
    ragConfigurations,
    setRagConfigurations,
    agentsConfigurations,
    setAgentsConfigurations,
    config,
    setConfig,
    loading,
    setLoading,
    name,
    setName,
    description,
    setDescription,
    supportedConfigs,
    setSupportedConfigs,
  };
}
