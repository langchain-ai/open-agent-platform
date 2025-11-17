"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ConfigurableFieldUIMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldAgentsMetadata,
} from "@/types/configurable";

interface ConfigPreset {
  name: string;
  description?: string;
  config: Record<string, any>;
}

interface ConfigState {
  configsByAgentId: Record<string, Record<string, any>>;
  presetsByAgentId: Record<string, ConfigPreset[]>;
  getAgentConfig: (agentId: string) => Record<string, any>;
  updateConfig: (agentId: string, key: string, value: any) => void;
  resetConfig: (agentId: string) => void;
  setDefaultConfig: (
    agentId: string,
    configurations:
      | ConfigurableFieldMCPMetadata[]
      | ConfigurableFieldUIMetadata[]
      | ConfigurableFieldRAGMetadata[]
      | ConfigurableFieldAgentsMetadata[],
  ) => void;
  resetStore: () => void;
  // Preset management
  savePreset: (
    agentId: string,
    presetName: string,
    description?: string,
  ) => void;
  loadPreset: (agentId: string, presetName: string) => void;
  deletePreset: (agentId: string, presetName: string) => void;
  getPresets: (agentId: string) => ConfigPreset[];
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      configsByAgentId: {},
      presetsByAgentId: {},

      getAgentConfig: (agentId: string) => {
        const state = get();
        const baseConfig = state.configsByAgentId[agentId];
        const toolsConfig = state.configsByAgentId[`${agentId}:selected-tools`];
        const ragConfig = state.configsByAgentId[`${agentId}:rag`];
        const agentsConfig = state.configsByAgentId[`${agentId}:agents`];
        const configObj = {
          ...baseConfig,
          ...toolsConfig,
          ...ragConfig,
          ...agentsConfig,
        };
        delete configObj.__defaultValues;
        return configObj;
      },

      updateConfig: (agentId, key, value) =>
        set((state) => ({
          configsByAgentId: {
            ...state.configsByAgentId,
            [agentId]: {
              ...(state.configsByAgentId[agentId] || {}),
              [key]: value,
            },
          },
        })),

      resetConfig: (agentId) => {
        set((state) => {
          const agentConfig = state.configsByAgentId[agentId];
          if (!agentConfig || !agentConfig.__defaultValues) {
            // If no config or default values exist for this agent, do nothing or set to empty
            return state;
          }
          const defaultsToUse = { ...agentConfig.__defaultValues };
          return {
            configsByAgentId: {
              ...state.configsByAgentId,
              [agentId]: defaultsToUse,
            },
          };
        });
      },

      setDefaultConfig: (agentId, configurations) => {
        const defaultConfig: Record<string, any> = {};
        configurations.forEach((config) => {
          if (config.default !== undefined) {
            defaultConfig[config.label] = config.default;
          }
        });

        defaultConfig.__defaultValues = { ...defaultConfig };

        set((currentState) => ({
          configsByAgentId: {
            ...currentState.configsByAgentId,
            [agentId]: defaultConfig,
          },
        }));
      },

      // Clear everything from the store
      resetStore: () => set({ configsByAgentId: {}, presetsByAgentId: {} }),

      // Preset management methods
      savePreset: (agentId, presetName, description) => {
        const state = get();
        const currentConfig = { ...state.configsByAgentId[agentId] };
        delete currentConfig.__defaultValues; // Don't save internal metadata

        const existingPresets = state.presetsByAgentId[agentId] || [];
        const newPreset: ConfigPreset = {
          name: presetName,
          description,
          config: currentConfig,
        };

        // Replace if preset name exists, otherwise add
        const updatedPresets = existingPresets.find(
          (p) => p.name === presetName,
        )
          ? existingPresets.map((p) => (p.name === presetName ? newPreset : p))
          : [...existingPresets, newPreset];

        set((state) => ({
          presetsByAgentId: {
            ...state.presetsByAgentId,
            [agentId]: updatedPresets,
          },
        }));
      },

      loadPreset: (agentId, presetName) => {
        const state = get();
        const presets = state.presetsByAgentId[agentId] || [];
        const preset = presets.find((p) => p.name === presetName);

        if (preset) {
          set((state) => ({
            configsByAgentId: {
              ...state.configsByAgentId,
              [agentId]: {
                ...preset.config,
                __defaultValues:
                  state.configsByAgentId[agentId]?.__defaultValues, // Preserve defaults
              },
            },
          }));
        }
      },

      deletePreset: (agentId, presetName) => {
        set((state) => ({
          presetsByAgentId: {
            ...state.presetsByAgentId,
            [agentId]: (state.presetsByAgentId[agentId] || []).filter(
              (p) => p.name !== presetName,
            ),
          },
        }));
      },

      getPresets: (agentId) => {
        const state = get();
        return state.presetsByAgentId[agentId] || [];
      },
    }),
    {
      name: "ai-config-storage", // Keep the same storage key, but manage agents inside
    },
  ),
);
