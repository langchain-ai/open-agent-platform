import { Tool } from "@/types/tool";
import _, { debounce } from "lodash";
import { useState, useMemo } from "react";

export function useSearchTools(
  tools: Tool[],
  args?: {
    preSelectedTools?: string[];
  },
) {
  const [toolSearchTerm, setToolSearchTerm] = useState("");

  // Debounced search handler
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: string) => setToolSearchTerm(value), 200),
    [],
  );

  // Filter tools based on the search term
  const filteredTools = useMemo(() => {
    if (!toolSearchTerm) return tools;
    return tools.filter((tool) => {
      return (
        _.startCase(tool.name)
          .toLowerCase()
          .includes(toolSearchTerm.toLowerCase()) ||
        tool.name.toLowerCase().includes(toolSearchTerm.toLowerCase())
      );
    });
  }, [tools, toolSearchTerm]);

  const displayTools = useMemo(() => {
    // If no tool configurations, just return filtered tools
    if (!args?.preSelectedTools?.length) {
      return filteredTools;
    }

    const preSelectedToolNames = new Set(args.preSelectedTools || []);
    const processedTools = new Set<string>();
    const result: Tool[] = [];

    // First add all pre-selected tools that match the search term (if any)
    filteredTools.forEach((tool) => {
      if (
        preSelectedToolNames.has(tool.name) &&
        !processedTools.has(tool.name)
      ) {
        result.push(tool);
        processedTools.add(tool.name);
      }
    });

    // Then add all other tools that match the search term
    filteredTools.forEach((tool) => {
      if (!processedTools.has(tool.name)) {
        result.push(tool);
        processedTools.add(tool.name);
      }
    });

    return result;
  }, [filteredTools, args?.preSelectedTools]);

  return {
    toolSearchTerm,
    debouncedSetSearchTerm,
    filteredTools,
    displayTools,
  };
}
