import { useLocalStorage } from "./use-local-storage";

/**
 * Custom hook to manage the last selected agent ID in local storage.
 * 
 * @returns A tuple containing the last selected agent ID and a function to update it.
 * The agent ID is stored in the format "agentId:deploymentId"
 */
export function useLastSelectedAgent(): [string | null, (agentId: string | null) => void] {
  const [lastSelectedAgent, setLastSelectedAgent] = useLocalStorage<string | null>(
    "oap-last-selected-agent",
    null
  );

  return [lastSelectedAgent, setLastSelectedAgent];
}
