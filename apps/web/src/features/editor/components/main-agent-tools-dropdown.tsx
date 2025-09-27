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
import { Check, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
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
  const selectedTools = (useWatch({
    control: toolsForm?.control,
    name: "tools",
  }) ?? []) as string[];
  const { filteredTools, debouncedSetSearchTerm } = useSearchTools(allTools, {
    preSelectedTools: selectedTools,
  });

  const [internalShowAdd, setInternalShowAdd] = React.useState(false);
  const effectiveShowAdd = showAdd ?? internalShowAdd;
  const [showAll, setShowAll] = React.useState(false);
  // Inline interrupt toggle; no dropdown state needed

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
    } else {
      toolsForm.setValue(
        "tools",
        current.filter((t) => t !== toolName),
        { shouldDirty: true },
      );
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
      <div
        className={`rounded-md p-2 pr-0 ${selectedTools.length > 0 ? "bg-gray-50" : ""}`}
      >
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
                {/* Interrupt indicator dot hidden for now */}
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
          <div className="mt-2">
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
                      <div className="group flex w-full items-center">
                        <button
                          className="flex-1 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
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
                                      checked={
                                        getInterruptConfig(tool.name) === true
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      onCheckedChange={(checked) => {
                                        onEnsureMainSelected?.();
                                        const allConfig =
                                          toolsForm?.getValues(
                                            "interruptConfig",
                                          ) || {};
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
                                    Pause the agent before this tool runs so you
                                    can approve or edit.
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
        )}
      </div>
    </div>
  );
}
