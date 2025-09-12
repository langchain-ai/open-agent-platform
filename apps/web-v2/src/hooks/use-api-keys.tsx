import { useLocalStorage } from "@/hooks/use-local-storage";

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

  return {
    apiKeys: {
      OPENAI_API_KEY: openaiApiKey,
      ANTHROPIC_API_KEY: anthropicApiKey,
      GOOGLE_API_KEY: googleApiKey,
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

  return Object.values(apiKeys).some((key) => key && key.trim() !== "");
}
