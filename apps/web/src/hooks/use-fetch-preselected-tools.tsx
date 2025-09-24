import {
  useState,
  useEffect,
  useCallback,
  SetStateAction,
  Dispatch,
} from "react";
import { Tool } from "@/types/tool";

interface UseFetchPreselectedToolsProps {
  tools: Tool[];
  setTools: Dispatch<SetStateAction<Tool[]>>;
  getTools: (cursor?: string) => Promise<Tool[]>;
  cursor: string;
  searchTerm?: string;
  preselectedTools?: string[];
}

/**
 * Hook to ensure all pre-selected tools are fetched and available in the tools list
 * Continues fetching tools until all pre-selected tools are found or there are no more tools to fetch
 */
export function useFetchPreselectedTools({
  tools,
  setTools,
  getTools,
  cursor,
  searchTerm,
  preselectedTools,
}: UseFetchPreselectedToolsProps) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchedAllPreSelectedTools, setFetchedAllPreSelectedTools] =
    useState(false);

  // Function to check if all pre-selected tools exist in the current tools list
  const checkPreSelectedTools = useCallback(() => {
    if (searchTerm || !preselectedTools?.length) {
      return true; // No pre-selected tools or search is active, no need to fetch more
    }

    const currentToolNames = tools.map((tool) => tool.name);

    // Check if all pre-selected tools exist in the current tools list
    return preselectedTools.every((toolName) =>
      currentToolNames.some((currentToolName) => currentToolName === toolName),
    );
  }, [tools, preselectedTools, searchTerm]);

  // Effect to fetch all pre-selected tools when component mounts or tools/cursor changes
  useEffect(() => {
    const fetchPreSelectedTools = async () => {
      if (
        fetchedAllPreSelectedTools ||
        !preselectedTools?.length ||
        searchTerm
      ) {
        return; // Already fetched all tools or no pre-selected tools or search is active
      }

      const allToolsExist = checkPreSelectedTools();

      if (allToolsExist) {
        setFetchedAllPreSelectedTools(true);
        return; // All pre-selected tools exist, no need to fetch more
      }

      if (!cursor && tools.length > 0) {
        setFetchedAllPreSelectedTools(true);
        return; // No more tools to fetch
      } else if (!cursor && tools.length === 0) {
        return; // No more tools to fetch
      }

      // Fetch more tools
      setLoadingMore(true);
      try {
        const moreTool = await getTools(cursor);
        setTools((prevTools) => [...prevTools, ...moreTool]);
      } catch (error) {
        console.error("Failed to load more tools:", error);
        setFetchedAllPreSelectedTools(true); // Stop trying on error
      } finally {
        setLoadingMore(false);
      }
    };

    fetchPreSelectedTools();
  }, [
    tools,
    cursor,
    preselectedTools,
    searchTerm,
    checkPreSelectedTools,
    fetchedAllPreSelectedTools,
    getTools,
    setTools,
  ]);

  return {
    loadingMore,
    setLoadingMore,
    fetchedAllPreSelectedTools,
  };
}
