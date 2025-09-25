"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search } from "@/components/ui/tool-search";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, HelpCircle, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { AgentToolsFormValues } from "@/components/agent-creator-sheet/components/agent-tools-form";
import type { HumanInterruptConfig } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import _ from "lodash";

export function MainAgentToolsDropdown({
  toolsForm,
  onEnsureMainSelected,
  hideTitle,
  hideHeader,
  showAdd,
  onToggleAdd,
}: {
  toolsForm: UseFormReturn<AgentToolsFormValues>;
  onEnsureMainSelected?: () => void;
  hideTitle?: boolean;
  hideHeader?: boolean;
  showAdd?: boolean;
  onToggleAdd?: (open: boolean) => void;
}) {
  const { tools: allTools } = useMCPContext();
  const selectedTools = (toolsForm?.watch("tools") ?? []) as string[];
  const { filteredTools, debouncedSetSearchTerm } = useSearchTools(allTools, {
    preSelectedTools: selectedTools,
  });

  const [internalShowAdd, setInternalShowAdd] = React.useState(false);
  const effectiveShowAdd = showAdd ?? internalShowAdd;
  const [showAll, setShowAll] = React.useState(false);
  const [openInterrupt, setOpenInterrupt] = React.useState<Set<string>>(
    new Set(),
  );

  const toggleAdd = () => {
    const next = !effectiveShowAdd;
    onEnsureMainSelected?.();
    if (onToggleAdd) onToggleAdd(next);
    else setInternalShowAdd(next);
  };

  const getInterruptConfig = (
    toolName: string,
  ): HumanInterruptConfig | undefined => {
    const all = (toolsForm?.watch("interruptConfig") || {}) as Record<
      string,
      HumanInterruptConfig
    >;
    return all[toolName];
  };

  const handleAddOrRemove = (toolName: string) => {
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

  const handleRemove = (toolName: string) => {
    onEnsureMainSelected?.();
    const current = (toolsForm.getValues("tools") || []) as string[];
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
  };

  // display-only icon; no dynamic color needed per design

  return (
    <div className="space-y-2">
      {!hideHeader && (
        <div
          className={cn(
            "flex items-center px-1",
            hideTitle ? "justify-end" : "justify-between",
          )}
        >
          {!hideTitle && (
            <div className="text-xs font-medium text-gray-500 uppercase">
              Tools
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-gray-600 hover:bg-gray-100"
            onClick={toggleAdd}
          >
            {effectiveShowAdd ? "Close" : "Add"}
          </Button>
        </div>
      )}
      <div className="rounded-md bg-gray-50 p-2 pr-0">
        <div className="flex flex-wrap gap-1">
          {(() => {
            const list = selectedTools;
            const visible = showAll ? list : list.slice(0, 6);
            return visible.map((t) => (
              <Badge
                key={`main-tool-${t}`}
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
        {effectiveShowAdd && (
          <div className="mt-2 -mr-2">
            <Search
              onSearchChange={(term) => debouncedSetSearchTerm(term)}
              placeholder="Search tools to add..."
            />
            <div className="mt-1">
              <div className="max-h-64 overflow-auto">
                {(() => {
                  const selected = (toolsForm?.watch("tools") ||
                    []) as string[];
                  const sorted = [...filteredTools].sort((a, b) => {
                    const aSel = selected.includes(a.name) ? 1 : 0;
                    const bSel = selected.includes(b.name) ? 1 : 0;
                    return bSel - aSel;
                  });
                  return sorted.slice(0, 50).map((tool) => (
                    <div key={`add-main-${tool.name}`}>
                      <div className="group flex w-full items-stretch">
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => handleAddOrRemove(tool.name)}
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
                            <span className="truncate">
                              {_.startCase(tool.name)}
                            </span>
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
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase">
                              <span>Interrupt</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3 w-3 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      Enabling interrupts will pause the agent
                                      before this tool's action is executed,
                                      allowing you to approve, reject, edit, or
                                      send feedback on the proposed action.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Switch
                              checked={getInterruptConfig(tool.name) === true}
                              onCheckedChange={(checked) => {
                                onEnsureMainSelected?.();
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
        )}
      </div>
    </div>
  );
}
