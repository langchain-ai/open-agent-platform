"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  config: Record<string, any>;
  updateConfig: (key: string, value: any) => void;
  resetConfig: () => void;
}

const defaultConfig = {
  systemPrompt: "You are a helpful AI assistant.",
  temperature: 0.7,
  maxTokens: 1024,
  useMarkdown: true,
  streamResponse: true,
  memoryEnabled: true,
  model: "gpt-4o",
  presencePenalty: 0,
  frequencyPenalty: 0,
  enableWebSearch: false,
  enableCalculator: false,
  enableCodeInterpreter: false,
  enableImageGeneration: false,
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: { ...defaultConfig },
      updateConfig: (key, value) =>
        set((state) => ({
          config: {
            ...state.config,
            [key]: value,
          },
        })),
      resetConfig: () => set({ config: { ...defaultConfig } }),
    }),
    {
      name: "ai-config-storage",
    },
  ),
);
