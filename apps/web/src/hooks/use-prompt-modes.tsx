/**
 * Hook for managing agent prompt template modes.
 *
 * Handles selection and persistence of which prompt template mode
 * is active for each tool in an agent's configuration.
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * State for prompt mode selections per agent
 */
interface PromptModesState {
  /**
   * Map of agent ID to their tool prompt modes configuration
   * Format: { [agentId]: { [toolName]: templateKey } }
   */
  promptModesByAgentId: Record<string, Record<string, string>>;

  /**
   * Map of agent ID to custom system prompts (when user edits template)
   */
  customPromptsByAgentId: Record<string, string>;

  /**
   * Map of agent ID to "use compiled" flag
   */
  useCompiledByAgentId: Record<string, boolean>;

  /**
   * Get prompt modes for a specific agent
   */
  getPromptModes: (agentId: string) => Record<string, string>;

  /**
   * Set prompt mode for a specific tool
   */
  setToolPromptMode: (
    agentId: string,
    toolName: string,
    templateKey: string,
  ) => void;

  /**
   * Remove prompt mode for a tool (when tool is disabled)
   */
  removeToolPromptMode: (agentId: string, toolName: string) => void;

  /**
   * Get custom system prompt for an agent
   */
  getCustomPrompt: (agentId: string) => string | undefined;

  /**
   * Set custom system prompt for an agent
   */
  setCustomPrompt: (agentId: string, prompt: string) => void;

  /**
   * Get whether agent uses compiled prompt (true) or custom (false)
   */
  getUseCompiled: (agentId: string) => boolean;

  /**
   * Set whether to use compiled prompt
   */
  setUseCompiled: (agentId: string, useCompiled: boolean) => void;

  /**
   * Reset all prompt configuration for an agent
   */
  resetAgentPrompts: (agentId: string) => void;

  /**
   * Clear all stored prompt configurations
   */
  resetStore: () => void;
}

export const usePromptModesStore = create<PromptModesState>()(
  persist(
    (set, get) => ({
      promptModesByAgentId: {},
      customPromptsByAgentId: {},
      useCompiledByAgentId: {},

      getPromptModes: (agentId) => {
        return get().promptModesByAgentId[agentId] || {};
      },

      setToolPromptMode: (agentId, toolName, templateKey) =>
        set((state) => ({
          promptModesByAgentId: {
            ...state.promptModesByAgentId,
            [agentId]: {
              ...(state.promptModesByAgentId[agentId] || {}),
              [toolName]: templateKey,
            },
          },
          // When user selects a mode, default to using compiled prompt
          useCompiledByAgentId: {
            ...state.useCompiledByAgentId,
            [agentId]: true,
          },
        })),

      removeToolPromptMode: (agentId, toolName) =>
        set((state) => {
          const modes = { ...(state.promptModesByAgentId[agentId] || {}) };
          delete modes[toolName];
          return {
            promptModesByAgentId: {
              ...state.promptModesByAgentId,
              [agentId]: modes,
            },
          };
        }),

      getCustomPrompt: (agentId) => {
        return get().customPromptsByAgentId[agentId];
      },

      setCustomPrompt: (agentId, prompt) =>
        set((state) => ({
          customPromptsByAgentId: {
            ...state.customPromptsByAgentId,
            [agentId]: prompt,
          },
          // When user sets custom prompt, mark as not using compiled
          useCompiledByAgentId: {
            ...state.useCompiledByAgentId,
            [agentId]: false,
          },
        })),

      getUseCompiled: (agentId) => {
        const value = get().useCompiledByAgentId[agentId];
        // Default to true if not set
        return value !== undefined ? value : true;
      },

      setUseCompiled: (agentId, useCompiled) =>
        set((state) => ({
          useCompiledByAgentId: {
            ...state.useCompiledByAgentId,
            [agentId]: useCompiled,
          },
        })),

      resetAgentPrompts: (agentId) =>
        set((state) => {
          const newModes = { ...state.promptModesByAgentId };
          const newCustom = { ...state.customPromptsByAgentId };
          const newUseCompiled = { ...state.useCompiledByAgentId };

          delete newModes[agentId];
          delete newCustom[agentId];
          delete newUseCompiled[agentId];

          return {
            promptModesByAgentId: newModes,
            customPromptsByAgentId: newCustom,
            useCompiledByAgentId: newUseCompiled,
          };
        }),

      resetStore: () =>
        set({
          promptModesByAgentId: {},
          customPromptsByAgentId: {},
          useCompiledByAgentId: {},
        }),
    }),
    {
      name: "agent-prompt-modes-storage",
    },
  ),
);

/**
 * Hook for managing agent prompt modes.
 * Convenience wrapper around the Zustand store.
 */
export function usePromptModes(agentId: string) {
  const store = usePromptModesStore();

  return {
    promptModes: store.getPromptModes(agentId),
    setToolPromptMode: (toolName: string, templateKey: string) =>
      store.setToolPromptMode(agentId, toolName, templateKey),
    removeToolPromptMode: (toolName: string) =>
      store.removeToolPromptMode(agentId, toolName),
    customPrompt: store.getCustomPrompt(agentId),
    setCustomPrompt: (prompt: string) => store.setCustomPrompt(agentId, prompt),
    useCompiled: store.getUseCompiled(agentId),
    setUseCompiled: (useCompiled: boolean) =>
      store.setUseCompiled(agentId, useCompiled),
    resetPrompts: () => store.resetAgentPrompts(agentId),
  };
}
