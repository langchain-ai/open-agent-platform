"use client";

import React from "react";
import { Agent } from "@/types/agent";
import { SubAgent } from "@/types/sub-agent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Users,
  Plus,
  Trash2,
  X,
  Check,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { Search } from "@/components/ui/tool-search";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import _ from "lodash";
import type { HumanInterruptConfig } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import type { UseFormReturn } from "react-hook-form";
import type { AgentToolsFormValues } from "@/components/agent-creator-sheet/components/agent-tools-form";

export type EditTarget =
  | { type: "main"; agent: Agent }
  | { type: "subagent"; subAgent: SubAgent; index: number };

interface AgentHierarchyNavProps {
  agent: Agent;
  currentTarget: EditTarget;
  onTargetChange: (target: EditTarget) => void;
  onCreateSubAgent: () => void;
  onDeleteSubAgent?: (index: number) => void;
  compact?: boolean;
  toolsForm?: UseFormReturn<AgentToolsFormValues>;
}

export function AgentHierarchyNav({
  agent,
  currentTarget,
  onTargetChange,
  onCreateSubAgent,
  onDeleteSubAgent,
  compact = false,
  toolsForm,
}: AgentHierarchyNavProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const subAgents =
    (agent?.config?.configurable?.subagents as SubAgent[]) || [];

  const isMainSelected = currentTarget.type === "main";

  // Tools data and search for the selected target only
  const { tools: allTools } = useMCPContext();
  const selectedTools = React.useMemo(() => {
    if (currentTarget.type === "subagent") {
      return currentTarget.subAgent.tools || [];
    }
    return (
      ((agent?.config?.configurable as any)?.tools?.tools as string[]) || []
    );
  }, [currentTarget, agent?.config?.configurable]);

  const { filteredTools, debouncedSetSearchTerm } = useSearchTools(allTools, {
    preSelectedTools: selectedTools,
  });
  // UI state for cleaner UX
  const [showAddMain, setShowAddMain] = React.useState(false);
  const [showAddSub, setShowAddSub] = React.useState<Record<number, boolean>>(
    {},
  );
  const [showAllMain, setShowAllMain] = React.useState(false);
  const [showAllSub, setShowAllSub] = React.useState<Record<number, boolean>>(
    {},
  );
  const [selectedAddMain, setSelectedAddMain] = React.useState<string | null>(
    null,
  );
  const [selectedAddSub, setSelectedAddSub] = React.useState<
    Record<number, string | null>
  >({});

  const handleAddTool = (toolName: string) => {
    if (!toolsForm) return;
    const current = toolsForm.getValues("tools") || [];
    if (!current.includes(toolName)) {
      toolsForm.setValue("tools", [...current, toolName], {
        shouldDirty: true,
      });
    }
  };

  const handleRemoveTool = (toolName: string) => {
    if (!toolsForm) return;
    const current = toolsForm.getValues("tools") || [];
    toolsForm.setValue(
      "tools",
      current.filter((t) => t !== toolName),
      { shouldDirty: true },
    );
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
  return (
    <div className={cn("w-full bg-gray-50/50", compact ? "p-2" : "p-4")}>
      <div className={cn(compact ? "space-y-1" : "space-y-2")}>
        {/* Main Agent */}
        <div
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors",
            isMainSelected ? "bg-[#2F6868] text-white" : "text-gray-800",
          )}
          onClick={() => onTargetChange({ type: "main", agent })}
        >
          <FileText className="h-4 w-4" />
          <span className="font-semibold">{agent.name}</span>
          <span className="text-xs opacity-75">(Main)</span>
        </div>
        {/* Tools under Main Agent */}
        <div className="ml-4">
          <div className="flex items-center justify-between px-3 py-1">
            <div className="text-xs font-medium text-gray-500 uppercase">
              Tools
            </div>
            {isMainSelected && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-gray-600 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddMain((v) => !v);
                }}
              >
                {showAddMain ? "Close" : "Add"}
              </Button>
            )}
          </div>
          <div className="px-3">
            <div className="rounded-md border border-gray-200 bg-white p-2">
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const list = isMainSelected
                    ? (toolsForm?.watch("tools") ?? [])
                    : ((agent?.config?.configurable as any)?.tools
                        ?.tools as string[]) || [];
                  const visible = showAllMain ? list : list.slice(0, 6);
                  return visible.map((t) => (
                    <Badge
                      key={`main-tool-${t}`}
                      variant="outline"
                      className={cn(
                        "border-gray-300 text-gray-700",
                        isMainSelected ? "pr-1" : "",
                      )}
                    >
                      {t}
                      {isMainSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTool(t);
                          }}
                          className="ml-1 opacity-60 hover:opacity-100"
                          aria-label={`Remove ${t}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ));
                })()}
                {(() => {
                  const list = isMainSelected
                    ? (toolsForm?.watch("tools") ?? [])
                    : ((agent?.config?.configurable as any)?.tools
                        ?.tools as string[]) || [];
                  const hiddenCount = Math.max(0, list.length - 6);
                  return hiddenCount > 0 && !showAllMain ? (
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-dashed text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllMain(true);
                      }}
                    >
                      +{hiddenCount} more
                    </Badge>
                  ) : null;
                })()}
                {(() => {
                  const list = isMainSelected
                    ? (toolsForm?.watch("tools") ?? [])
                    : ((agent?.config?.configurable as any)?.tools
                        ?.tools as string[]) || [];
                  return list.length === 0 ? (
                    <span className="text-xs text-gray-500">
                      No tools selected
                    </span>
                  ) : null;
                })()}
              </div>
              {isMainSelected && showAddMain && (
                <div className="mt-2">
                  <Search
                    onSearchChange={(term) => debouncedSetSearchTerm(term)}
                    placeholder="Search tools to add..."
                  />
                  <div className="mt-1 rounded-md border border-gray-200 bg-white">
                    <div className="max-h-64 overflow-auto">
                      {(() => {
                        const selected = toolsForm?.watch("tools") || [];
                        const sorted = [...filteredTools].sort((a, b) => {
                          const aSel = selected.includes(a.name) ? 1 : 0;
                          const bSel = selected.includes(b.name) ? 1 : 0;
                          return bSel - aSel; // selected first
                        });
                        return sorted.slice(0, 50).map((tool) => (
                          <div key={`add-main-${tool.name}`}>
                            <div className="group flex w-full items-stretch">
                              <button
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddTool(tool.name);
                                  setSelectedAddMain(
                                    selectedAddMain === tool.name
                                      ? null
                                      : tool.name,
                                  );
                                }}
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
                                  {_.startCase(tool.name)}
                                </div>
                                {tool.description && (
                                  <div className="line-clamp-2 pl-6 text-xs text-gray-500">
                                    {tool.description}
                                  </div>
                                )}
                              </button>
                            </div>
                            {selectedAddMain === tool.name && (
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
                                            Pause execution and ask for user
                                            approval before calling this tool
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={
                                      getInterruptConfig(tool.name) === true
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="h-8 w-16 justify-center text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allConfig =
                                        toolsForm?.getValues(
                                          "interruptConfig",
                                        ) || {};
                                      toolsForm?.setValue(
                                        "interruptConfig",
                                        {
                                          ...allConfig,
                                          [tool.name]: true,
                                        },
                                        { shouldDirty: true },
                                      );
                                    }}
                                  >
                                    true
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={
                                      getInterruptConfig(tool.name) === false
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="h-8 w-16 justify-center text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allConfig =
                                        toolsForm?.getValues(
                                          "interruptConfig",
                                        ) || {};
                                      toolsForm?.setValue(
                                        "interruptConfig",
                                        {
                                          ...allConfig,
                                          [tool.name]: false,
                                        },
                                        { shouldDirty: true },
                                      );
                                    }}
                                  >
                                    false
                                  </Button>
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
        </div>

        {/* Sub-agents Section */}
        {subAgents.length > 0 && (
          <div>
            <div
              className="flex cursor-pointer items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Sub-agents ({subAgents.length})
            </div>

            {isExpanded && (
              <div className="ml-4 space-y-2">
                {subAgents.map((subAgent, index) => {
                  const isSelected =
                    currentTarget.type === "subagent" &&
                    currentTarget.index === index;

                  const saTools = isSelected
                    ? (toolsForm?.watch("tools") ?? [])
                    : subAgent.tools || [];
                  const hiddenCount = Math.max(0, saTools.length - 6);
                  const showAll = !!showAllSub[index];
                  const visibleList = showAll ? saTools : saTools.slice(0, 6);

                  return (
                    <div key={`${subAgent.name}-${index}`}>
                      <div
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                          isSelected
                            ? "bg-[#2F6868] text-white"
                            : "text-gray-700",
                        )}
                      >
                        <button
                          type="button"
                          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
                          onClick={() =>
                            onTargetChange({
                              type: "subagent",
                              subAgent,
                              index,
                            })
                          }
                        >
                          <Users className="h-4 w-4" />
                          <span className="truncate">{subAgent.name}</span>
                        </button>
                        {onDeleteSubAgent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "ml-auto h-6 w-6 p-0 transition-opacity",
                              isSelected
                                ? "text-white opacity-100 hover:text-white"
                                : "hover:text-destructive text-gray-400 opacity-0 group-hover:opacity-100",
                            )}
                            aria-label="Delete sub-agent"
                            title="Delete sub-agent"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSubAgent(index);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Tools nested under each sub-agent */}
                      <div className="px-3">
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-xs font-medium text-gray-500 uppercase">
                            Tools
                          </div>
                          {isSelected && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-gray-600 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAddSub((m) => ({
                                  ...m,
                                  [index]: !m[index],
                                }));
                              }}
                            >
                              {showAddSub[index] ? "Close" : "Add"}
                            </Button>
                          )}
                        </div>
                        <div className="rounded-md border border-gray-200 bg-white p-2">
                          <div className="flex flex-wrap gap-1">
                            {visibleList.map((t) => (
                              <Badge
                                key={`sa-${index}-tool-${t}`}
                                variant="outline"
                                className={cn(
                                  "border-gray-300 text-gray-700",
                                  isSelected ? "pr-1" : "",
                                )}
                              >
                                {t}
                                {isSelected && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTool(t);
                                    }}
                                    className="ml-1 opacity-60 hover:opacity-100"
                                    aria-label={`Remove ${t}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </Badge>
                            ))}
                            {hiddenCount > 0 && !showAll && (
                              <Badge
                                variant="outline"
                                className="cursor-pointer border-dashed text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAllSub((m) => ({
                                    ...m,
                                    [index]: true,
                                  }));
                                }}
                              >
                                +{hiddenCount} more
                              </Badge>
                            )}
                            {saTools.length === 0 && (
                              <span className="text-xs text-gray-500">
                                No tools selected
                              </span>
                            )}
                          </div>
                          {isSelected && showAddSub[index] && (
                            <div className="mt-2">
                              <Search
                                onSearchChange={(term) =>
                                  debouncedSetSearchTerm(term)
                                }
                                placeholder={`Search tools for ${subAgent.name}...`}
                              />
                              <div className="mt-1 rounded-md border border-gray-200 bg-white">
                                <div className="max-h-64 overflow-auto">
                                  {(() => {
                                    const selected =
                                      toolsForm?.watch("tools") || [];
                                    const sorted = [...filteredTools].sort(
                                      (a, b) => {
                                        const aSel = selected.includes(a.name)
                                          ? 1
                                          : 0;
                                        const bSel = selected.includes(b.name)
                                          ? 1
                                          : 0;
                                        return bSel - aSel;
                                      },
                                    );
                                    return sorted.slice(0, 50).map((tool) => (
                                      <div key={`add-sa-${index}-${tool.name}`}>
                                        <div className="group flex w-full items-stretch">
                                          <button
                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddTool(tool.name);
                                              setSelectedAddSub((m) => ({
                                                ...m,
                                                [index]:
                                                  selectedAddSub[index] ===
                                                  tool.name
                                                    ? null
                                                    : tool.name,
                                              }));
                                            }}
                                          >
                                            <div className="flex items-center gap-2 font-medium">
                                              <Check
                                                className={cn(
                                                  "h-3.5 w-3.5",
                                                  selected.includes(tool.name)
                                                    ? "text-[#2F6868]"
                                                    : "text-transparent",
                                                )}
                                              />
                                              {_.startCase(tool.name)}
                                            </div>
                                            {tool.description && (
                                              <div className="line-clamp-2 pl-6 text-xs text-gray-500">
                                                {tool.description}
                                              </div>
                                            )}
                                          </button>
                                        </div>
                                        {selectedAddSub[index] ===
                                          tool.name && (
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
                                                        Pause execution and ask
                                                        for user approval before
                                                        calling this tool
                                                      </p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </TooltipProvider>
                                              </div>
                                              <Button
                                                size="sm"
                                                variant={
                                                  getInterruptConfig(
                                                    tool.name,
                                                  ) === true
                                                    ? "secondary"
                                                    : "outline"
                                                }
                                                className="h-8 w-16 justify-center text-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const allConfig =
                                                    toolsForm?.getValues(
                                                      "interruptConfig",
                                                    ) || {};
                                                  toolsForm?.setValue(
                                                    "interruptConfig",
                                                    {
                                                      ...allConfig,
                                                      [tool.name]: true,
                                                    },
                                                    { shouldDirty: true },
                                                  );
                                                }}
                                              >
                                                true
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant={
                                                  getInterruptConfig(
                                                    tool.name,
                                                  ) === false
                                                    ? "secondary"
                                                    : "outline"
                                                }
                                                className="h-8 w-16 justify-center text-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const allConfig =
                                                    toolsForm?.getValues(
                                                      "interruptConfig",
                                                    ) || {};
                                                  toolsForm?.setValue(
                                                    "interruptConfig",
                                                    {
                                                      ...allConfig,
                                                      [tool.name]: false,
                                                    },
                                                    { shouldDirty: true },
                                                  );
                                                }}
                                              >
                                                false
                                              </Button>
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
                      {/* Removed larger per-tool detail list to avoid duplication */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tools under Sub-agents (same look as main) */}
        {/* Removed separate sub-agent tools list; now nested under each entry above. */}

        {/* Create New Sub-agent Button */}
        <div className="pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateSubAgent}
            className="mt-1 w-full justify-start gap-2 text-gray-600 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            Create sub-agent
          </Button>
        </div>
      </div>
    </div>
  );
}
