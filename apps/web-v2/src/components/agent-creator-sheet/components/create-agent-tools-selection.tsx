"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRightIcon, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { Tool } from "@/types/tool";
import _ from "lodash";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";

export interface HumanInterruptConfig {
  allow_ignore: boolean;
  allow_respond: boolean;
  allow_edit: boolean;
  allow_accept: boolean;
}

const INTERRUPT_OPTIONS = [
  { value: "accept", label: "allow accept", disabled: false },
  { value: "respond", label: "allow respond", disabled: false },
  { value: "edit", label: "allow edit", disabled: false },
  { value: "ignore", label: "allow ignore", disabled: true },
];

export type ToolInterruptConfig = Record<string, HumanInterruptConfig>;

interface CreateAgentToolsSelectionProps {
  selectedTools?: string[];
  onToolsChange: (tools: string[]) => void;
  interruptConfig?: ToolInterruptConfig;
  onInterruptConfigChange?: (config: ToolInterruptConfig) => void;
}

export function CreateAgentToolsSelection({
  selectedTools = [],
  onToolsChange,
  interruptConfig = {},
  onInterruptConfigChange,
}: CreateAgentToolsSelectionProps) {
  const { tools, loading, getTools, cursor, setTools } = useMCPContext();
  const { toolSearchTerm, filteredTools } = useSearchTools(tools);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    if (!cursor) return;

    setLoadingMore(true);
    try {
      const newTools = await getTools(cursor);
      setTools((prevTools) => [...prevTools, ...newTools]);
    } catch (error) {
      console.error("Error loading more tools:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToolToggle = (toolName: string, checked: boolean) => {
    if (checked) {
      onToolsChange([...selectedTools, toolName]);
    } else {
      onToolsChange(selectedTools.filter((name) => name !== toolName));
    }
  };

  const handleInterruptConfigChange = (
    toolName: string,
    config: HumanInterruptConfig,
  ) => {
    if (!onInterruptConfigChange) return;

    const newConfig = {
      ...interruptConfig,
      [toolName]: config,
    };

    onInterruptConfigChange(newConfig);
  };

  const isToolSelected = (toolName: string) => selectedTools.includes(toolName);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {loading && !filteredTools.length && (
          <div className="py-8 text-center">
            <span className="text-muted-foreground">Loading tools...</span>
          </div>
        )}

        {!loading &&
          filteredTools.map((tool, index) => (
            <ToolSelectionCard
              key={`${tool.name}-${index}`}
              tool={tool}
              isSelected={isToolSelected(tool.name) || false}
              onToggle={handleToolToggle}
              interruptConfig={interruptConfig[tool.name]}
              onInterruptConfigChange={(config) =>
                handleInterruptConfigChange(tool.name, config)
              }
            />
          ))}

        {filteredTools.length === 0 && toolSearchTerm && !loading && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              No tools found matching "{toolSearchTerm}".
            </p>
          </div>
        )}

        {tools.length === 0 && !toolSearchTerm && !loading && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No tools available.</p>
          </div>
        )}
      </div>

      {!toolSearchTerm && cursor && (
        <div className="flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            className="gap-2"
          >
            {loadingMore ? "Loading..." : "Load More Tools"}
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Loading More Tools */}
      {loadingMore && (
        <div className="py-4 text-center">
          <span className="text-muted-foreground">Loading more tools...</span>
        </div>
      )}
    </div>
  );
}

interface ToolSelectionCardProps {
  tool: Tool;
  isSelected: boolean;
  onToggle: (toolName: string, checked: boolean) => void;
  interruptConfig?: HumanInterruptConfig;
  onInterruptConfigChange?: (config: HumanInterruptConfig) => void;
}

function ToolSelectionCard({
  tool,
  isSelected,
  onToggle,
  interruptConfig,
  onInterruptConfigChange,
}: ToolSelectionCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getFirstLine = (text: string) => {
    const lines = text.split("\n");
    return lines[0] || text;
  };

  const firstLineDescription = tool.description
    ? getFirstLine(tool.description)
    : "";
  const hasMoreDescription =
    tool.description && tool.description.split("\n").length > 1;

  return (
    <div
      className={cn(
        "cursor-pointer rounded-lg border border-gray-300 p-4 transition-colors hover:bg-gray-50",
        showDetails ? "bg-gray-50" : "bg-white",
      )}
      onClick={() => setShowDetails((prev) => !prev)}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          onClick={(e) => {
            e.stopPropagation();
            onToggle(tool.name, !isSelected);
            if (!showDetails && !isSelected) {
              setShowDetails(true);
            }
          }}
          checked={isSelected}
          className="mt-1 border-gray-300 data-[state=checked]:border-[#2F6868] data-[state=checked]:bg-[#2F6868]"
        />

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-normal text-gray-700">
                  {_.startCase(tool.name)}
                </p>
                <p className="text-sm font-light text-gray-600">
                  {hasMoreDescription && !showDetails ? (
                    <span>{firstLineDescription} ...</span>
                  ) : (
                    tool.description
                  )}
                </p>
              </div>

              {showDetails && (
                <div
                  className="flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="text-sm font-normal text-gray-700">
                    Configure interrupts
                  </h4>
                  <InterruptMultiSelect
                    interruptConfig={interruptConfig}
                    onInterruptConfigChange={onInterruptConfigChange}
                  />
                  <p className="text-xs font-light text-gray-600">
                    The agent will stop and let you decide what to do before
                    continuing
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <ChevronDown
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails((prev) => !prev);
                }}
                className={cn(
                  `h-6 w-6 text-gray-400 transition-transform`,
                  showDetails ? "rotate-180" : "",
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InterruptMultiSelectProps {
  interruptConfig?: HumanInterruptConfig;
  onInterruptConfigChange?: (config: HumanInterruptConfig) => void;
}

function InterruptMultiSelect({
  interruptConfig,
  onInterruptConfigChange,
}: InterruptMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const getSelectedOptions = () => {
    if (!interruptConfig) {
      return [];
    }

    const selected: string[] = [];
    if (interruptConfig.allow_accept) selected.push("accept");
    if (interruptConfig.allow_respond) selected.push("respond");
    if (interruptConfig.allow_edit) selected.push("edit");
    return selected;
  };

  const handleSelect = (option: string) => {
    if (!onInterruptConfigChange) return;

    const selected = getSelectedOptions();
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    const newConfig: HumanInterruptConfig = {
      allow_ignore: false, // always use false
      allow_accept: newSelected.includes("accept"),
      allow_respond: newSelected.includes("respond"),
      allow_edit: newSelected.includes("edit"),
    };

    onInterruptConfigChange(newConfig);
  };

  const selectedOptions = getSelectedOptions();
  const displayText =
    selectedOptions.length > 0
      ? selectedOptions
          .map((opt) => INTERRUPT_OPTIONS.find((o) => o.value === opt)?.label)
          .join(", ")
      : "Select interrupt options...";

  return (
    <Combobox
      open={open}
      onOpenChange={setOpen}
      displayText={displayText}
      options={INTERRUPT_OPTIONS}
      selectedOptions={selectedOptions}
      onSelect={handleSelect}
    />
  );
}
