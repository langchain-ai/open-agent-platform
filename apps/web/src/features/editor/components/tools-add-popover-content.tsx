"use client";

import React from "react";
import { Search } from "@/components/ui/tool-search";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UseFormReturn } from "react-hook-form";
import type { AgentToolsFormValues } from "@/components/agent-creator-sheet/components/agent-tools-form";
import type { HumanInterruptConfig } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import _ from "lodash";

export function ToolsAddPopoverContent({
  toolsForm,
  onEnsureMainSelected,
}: {
  toolsForm: UseFormReturn<AgentToolsFormValues>;
  onEnsureMainSelected?: () => void;
}) {
  const { tools: allTools } = useMCPContext();
  const selectedTools = (toolsForm?.watch("tools") ?? []) as string[];
  const { filteredTools, debouncedSetSearchTerm } = useSearchTools(allTools, {
    preSelectedTools: selectedTools,
  });

  // Inline interrupt toggle shown when a tool is selected; no dropdown state

  const getInterruptConfig = (
    toolName: string,
  ): HumanInterruptConfig | undefined => {
    const all = (toolsForm?.watch("interruptConfig") || {}) as Record<
      string,
      HumanInterruptConfig
    >;
    return all[toolName];
  };

  const toggleSelect = (toolName: string) => {
    onEnsureMainSelected?.();
    const current = (toolsForm.getValues("tools") || []) as string[];
    if (!current.includes(toolName)) {
      toolsForm.setValue("tools", [...current, toolName], {
        shouldDirty: true,
      });
    } else {
      toolsForm.setValue(
        "tools",
        current.filter((t) => t !== toolName),
        { shouldDirty: true },
      );
    }
  };

  // using static icon per design

  return (
    <div className="w-[560px] max-w-[90vw] p-2 pr-1">
      <Search
        onSearchChange={(term) => debouncedSetSearchTerm(term)}
        placeholder="Search tools..."
      />
      <div className="mt-2">
        <div className="max-h-80 overflow-auto">
          {(() => {
            const selected = (toolsForm?.watch("tools") || []) as string[];
            const sorted = [...filteredTools].sort((a, b) => {
              const aSel = selected.includes(a.name) ? 1 : 0;
              const bSel = selected.includes(b.name) ? 1 : 0;
              return bSel - aSel; // selected first
            });
            return sorted.slice(0, 200).map((tool) => (
              <div key={`popover-add-${tool.name}`}>
                <div className="group flex w-full items-center">
                  <button
                    className="flex-1 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => toggleSelect(tool.name)}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Check
                        className={cn(
                          "h-3.5 w-3.5",
                          (selected || []).includes(tool.name)
                            ? "text-[#2F6868]"
                            : "text-transparent",
                        )}
                      />
                      <span className="truncate">{_.startCase(tool.name)}</span>
                      {getInterruptConfig(tool.name) === true && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-4 px-1 text-[10px]"
                        >
                          interrupt
                        </Badge>
                      )}
                    </div>
                    {tool.description && (
                      <div className="line-clamp-2 pl-6 text-xs text-gray-500">
                        {tool.description}
                      </div>
                    )}
                  </button>
                  {(selected || []).includes(tool.name) && (
                    <div className="ml-auto flex items-center gap-2 pr-2">
                      <span className="text-[10px] text-gray-500 uppercase">
                        Interrupt
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Switch
                                checked={getInterruptConfig(tool.name) === true}
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={(checked) => {
                                  const allConfig =
                                    toolsForm?.getValues("interruptConfig") ||
                                    {};
                                  toolsForm?.setValue(
                                    "interruptConfig",
                                    {
                                      ...allConfig,
                                      [tool.name]: checked,
                                    },
                                    { shouldDirty: true },
                                  );
                                }}
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Pause the agent before this tool runs so you can
                              approve or edit.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
      </div>
    </div>
  );
}
