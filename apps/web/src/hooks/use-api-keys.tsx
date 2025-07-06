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
  const [tavilyApiKey] = useLocalStorage<string>(
    "lg:settings:tavilyApiKey",
    "",
  );

  return {
    apiKeys: {
      OPENAI_API_KEY: openaiApiKey,
      ANTHROPIC_API_KEY: anthropicApiKey,
      GOOGLE_API_KEY: googleApiKey,
      TAVILY_API_KEY: tavilyApiKey,
    },
  };
}
