"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Search } from "@/components/ui/tool-search";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { HumanInterruptConfig } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import _ from "lodash";

type ToolInterruptConfig = Record<string, HumanInterruptConfig>;

interface SubagentToolsSelectionProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  interruptConfig: ToolInterruptConfig;
  onInterruptConfigChange: (config: ToolInterruptConfig) => void;
}

export function SubagentToolsSelection({
  selectedTools,
  onToolsChange,
  interruptConfig,
  onInterruptConfigChange,
}: SubagentToolsSelectionProps) {
  const { tools: allTools } = useMCPContext();
  const { filteredTools, debouncedSetSearchTerm, toolSearchTerm } =
    useSearchTools(allTools, {
      preSelectedTools: selectedTools,
    });

  const [showAll, setShowAll] = React.useState(false);
  // Inline interrupt toggle shown for selected tools; no extra state

  const [showResults, setShowResults] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDocPointerDown = (e: MouseEvent | PointerEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setShowResults(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowResults(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const getInterruptConfig = (
    toolName: string,
  ): HumanInterruptConfig | undefined => {
    return interruptConfig[toolName];
  };

  const handleAddOrRemove = (toolName: string) => {
    if (!selectedTools.includes(toolName)) {
      onToolsChange([...selectedTools, toolName]);
    } else {
      onToolsChange(selectedTools.filter((t) => t !== toolName));
    }
  };

  const handleRemove = (toolName: string) => {
    onToolsChange(selectedTools.filter((t) => t !== toolName));
    // no local state to update
  };

  return (
    <div className="space-y-2">
      <div
        className="p-0"
        ref={containerRef}
      >
        <div className="flex flex-wrap gap-1">
          {(() => {
            const list = selectedTools;
            const visible = showAll ? list : list.slice(0, 6);
            return visible.map((t) => (
              <Badge
                key={`subagent-tool-${t}`}
                variant="outline"
                className="border-gray-300 pr-1 text-gray-700"
              >
                <span className="mr-1 inline-flex items-center gap-1">
                  <Wrench className="size-3.5 text-[#2F6868]" />
                  <span className="truncate">{_.startCase(t)}</span>
                </span>
                {getInterruptConfig(t) === true && (
                  <span
                    title="Interrupts enabled"
                    className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#2F6868]"
                  />
                )}
                <button
                  onClick={() => handleRemove(t)}
                  className="ml-1 opacity-60 hover:opacity-100"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ));
          })()}
          {(() => {
            const hiddenCount = Math.max(0, selectedTools.length - 6);
            return hiddenCount > 0 && !showAll ? (
              <Badge
                variant="outline"
                className="cursor-pointer border-dashed text-gray-600"
                onClick={() => setShowAll(true)}
              >
                +{hiddenCount} more
              </Badge>
            ) : null;
          })()}
          {selectedTools.length === 0 && (
            <span className="text-xs text-gray-500">No tools selected</span>
          )}
        </div>
        <div className="relative mt-2">
          <Search
            onSearchChange={(term) => {
              debouncedSetSearchTerm(term);
              setShowResults(true);
            }}
            placeholder="Search tools to add..."
            onFocus={() => setShowResults(true)}
          />
          {toolSearchTerm.trim() !== "" && showResults && (
            <div className="absolute top-full right-0 left-0 z-40 mt-1 max-h-64 overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
              {(() => {
                const sorted = [...filteredTools].sort((a, b) => {
                  const aSel = selectedTools.includes(a.name) ? 1 : 0;
                  const bSel = selectedTools.includes(b.name) ? 1 : 0;
                  return bSel - aSel;
                });
                return sorted.slice(0, 50).map((tool) => (
                  <div
                    key={`add-subagent-${tool.name}`}
                    className="relative"
                  >
                    <div className="group flex w-full items-center">
                      <button
                        className="flex-1 px-3 py-2 text-left text-sm text-gray-700 hover:bg-transparent"
                        onClick={() => handleAddOrRemove(tool.name)}
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Check
                            className={cn(
                              "h-3.5 w-3.5",
                              selectedTools.includes(tool.name)
                                ? "text-[#2F6868]"
                                : "text-transparent",
                            )}
                          />
                          <span className="truncate">
                            {_.startCase(tool.name)}
                          </span>
                        </div>
                        {tool.description && (
                          <div className="line-clamp-2 pl-6 text-xs text-gray-500">
                            {tool.description}
                          </div>
                        )}
                      </button>
                      {selectedTools.includes(tool.name) && (
                        <div className="ml-auto flex items-center gap-2 pr-2">
                          <span className="text-[10px] text-gray-500 uppercase">
                            Interrupt
                          </span>
                          <Switch
                            checked={getInterruptConfig(tool.name) === true}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={(checked) => {
                              const newConfig = {
                                ...interruptConfig,
                                [tool.name]: checked,
                              };
                              onInterruptConfigChange(newConfig);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
              {filteredTools.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-500">
                  No tools found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
