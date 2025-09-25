"use client";

import React from "react";
import { Search } from "@/components/ui/tool-search";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, HelpCircle } from "lucide-react";
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

  const [openInterrupt, setOpenInterrupt] = React.useState<Set<string>>(
    new Set(),
  );

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
      setOpenInterrupt((prev) => new Set(prev).add(toolName));
    } else {
      toolsForm.setValue(
        "tools",
        current.filter((t) => t !== toolName),
        { shouldDirty: true },
      );
      setOpenInterrupt((prev) => {
        const next = new Set(prev);
        next.delete(toolName);
        return next;
      });
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
                <div className="group flex w-full items-stretch">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
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
                  <button
                    type="button"
                    className="px-2 text-gray-400 transition-colors hover:text-gray-600"
                    title="Expand/collapse interrupt"
                    onClick={() => {
                      onEnsureMainSelected?.();
                      setOpenInterrupt((prev) => {
                        const next = new Set(prev);
                        if (next.has(tool.name)) next.delete(tool.name);
                        else next.add(tool.name);
                        return next;
                      });
                    }}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openInterrupt.has(tool.name) ? "rotate-180" : "",
                      )}
                    />
                  </button>
                </div>
                {openInterrupt.has(tool.name) && (
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase">
                        <span>Interrupt</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Enabling interrupts will pause the agent before
                                this tool's action is executed, allowing you to
                                approve, reject, edit, or send feedback on the
                                proposed action.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Switch
                        checked={getInterruptConfig(tool.name) === true}
                        onCheckedChange={(checked) => {
                          const allConfig =
                            toolsForm?.getValues("interruptConfig") || {};
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
                    </div>
                  </div>
                )}
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
