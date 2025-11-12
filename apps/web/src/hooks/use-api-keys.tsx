import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMemo } from "react";

export function useApiKeys() {
  const [openaiApiKey] = useLocalStorage<string>(
    "lg:settings:openaiApiKey",
    "",
  );
  const [anthropicApiKey] = useLocalStorage<string>(
    "lg:settings:anthropicApiKey",
    "",
  );
  const [googleApiKey] = useLocalStorage<string>(
    "lg:settings:googleApiKey",
    "",
  );
  const [tavilyApiKey] = useLocalStorage<string>(
    "lg:settings:tavilyApiKey",
    "",
  );
  const [ollamaApiKey] = useLocalStorage<string>(
    "lg:settings:ollamaApiKey",
    "",
  );
  const [xaiApiKey] = useLocalStorage<string>("lg:settings:xaiApiKey", "");

  return {
    apiKeys: {
      OPENAI_API_KEY: openaiApiKey,
      ANTHROPIC_API_KEY: anthropicApiKey,
      GOOGLE_API_KEY: googleApiKey,
      TAVILY_API_KEY: tavilyApiKey,
      OLLAMA_API_KEY: ollamaApiKey,
      XAI_API_KEY: xaiApiKey,
    },
  };
}

/**
 * Utility function to check if any API keys are set.
 * Uses the useApiKeys hook to check if any of the API key values are non-empty strings.
 * @returns boolean - true if at least one API key is set, false otherwise
 */
export function useHasApiKeys(): boolean {
  const { apiKeys } = useApiKeys();
  const {
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    GOOGLE_API_KEY,
    TAVILY_API_KEY,
    OLLAMA_API_KEY,
    XAI_API_KEY,
  } = apiKeys;

  return useMemo(
    () =>
      [
        OPENAI_API_KEY,
        ANTHROPIC_API_KEY,
        GOOGLE_API_KEY,
        TAVILY_API_KEY,
        OLLAMA_API_KEY,
        XAI_API_KEY,
      ].some((key) => key && key.trim() !== ""),
    [
      OPENAI_API_KEY,
      ANTHROPIC_API_KEY,
      GOOGLE_API_KEY,
      TAVILY_API_KEY,
      OLLAMA_API_KEY,
      XAI_API_KEY,
    ],
  );
}
