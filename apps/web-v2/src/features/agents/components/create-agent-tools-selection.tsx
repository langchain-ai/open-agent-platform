"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface HumanInterruptConfig {
  allow_ignore: boolean;
  allow_respond: boolean;
  allow_edit: boolean;
  allow_accept: boolean;
}

const INTERRUPT_OPTIONS = [
  { value: "accept", label: "allow accept" },
  { value: "respond", label: "allow respond" },
  { value: "edit", label: "allow edit" },
  { value: "ignore", label: "allow ignore", disabled: true },
] as const;

interface ToolInterruptConfig {
  [toolName: string]: HumanInterruptConfig;
}

interface CreateAgentToolsSelectionProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  interruptConfig?: ToolInterruptConfig;
  onInterruptConfigChange?: (config: ToolInterruptConfig) => void;
}

export function CreateAgentToolsSelection({
  selectedTools,
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
      {/* Header */}

      {/* Tools List */}
      <div className="space-y-4">
        {loading &&
          !filteredTools.length &&
          Array.from({ length: 4 }).map((_, index) => (
            <ToolSelectionCardLoading key={`tool-loading-${index}`} />
          ))}

        {filteredTools.map((tool, index) => (
          <ToolSelectionCard
            key={`${tool.name}-${index}`}
            tool={tool}
            isSelected={isToolSelected(tool.name)}
            onToggle={handleToolToggle}
            interruptConfig={interruptConfig[tool.name]}
            onInterruptConfigChange={(config) =>
              handleInterruptConfigChange(tool.name, config)
            }
          />
        ))}

        {filteredTools.length === 0 && toolSearchTerm && (
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

      {/* Load More Button */}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <ToolSelectionCardLoading key={`tool-loading-more-${index}`} />
          ))}
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
  const [showMore, setShowMore] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <div
      className={`cursor-pointer rounded-lg border border-gray-300 p-4 transition-colors hover:bg-gray-50 ${
        showMore ? "bg-gray-50" : "bg-white"
      }`}
      onClick={() => setShowMore(!showMore)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              onToggle(tool.name, checked as boolean);
              // Auto-expand the card when checkbox is clicked
              if (!showMore) {
                setShowMore(true);
              }
            }}
            className="mt-1 border-gray-300 data-[state=checked]:border-[#2F6868] data-[state=checked]:bg-[#2F6868]"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-gray-700">
                {_.startCase(tool.name)}
              </h3>
              <p className="mb-2 text-sm text-gray-600">
                {!showMore ? (
                  // Show only the part before "Args:" when collapsed
                  tool.description?.split("Args:")[0]?.trim() ||
                  tool.description ||
                  ""
                ) : (
                  // When card is expanded, show truncated or full description
                  <>
                    {!showFullDescription && tool.description?.includes("Args:")
                      ? tool.description?.split("Args:")[0]?.trim() ||
                        tool.description ||
                        ""
                      : tool.description || ""}
                    {!showFullDescription &&
                      tool.description?.includes("Args:") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFullDescription(true);
                          }}
                          className="ml-1 text-sm text-gray-900 underline hover:text-gray-800"
                        >
                          Show more
                        </button>
                      )}
                  </>
                )}
              </p>

              {/* Interrupt Configuration - only when expanded */}
              {showMore && (
                <div
                  className="mt-3 border-t border-gray-100 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="mb-3 text-sm font-medium text-gray-700">
                    Configure interrupts
                  </h4>
                  <InterruptMultiSelect
                    tool={tool}
                    interruptConfig={interruptConfig}
                    onInterruptConfigChange={onInterruptConfigChange}
                  />
                </div>
              )}
            </div>

            {/* Chevron icon - visual indicator */}
            <div className="flex items-center">
              <ChevronDown
                className={`h-6 w-6 text-gray-400 transition-transform ${showMore ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolSelectionCardLoading() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-4 w-4 animate-pulse rounded bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface InterruptMultiSelectProps {
  tool: Tool;
  interruptConfig?: HumanInterruptConfig;
  onInterruptConfigChange?: (config: HumanInterruptConfig) => void;
}

function InterruptMultiSelect({
  tool,
  interruptConfig,
  onInterruptConfigChange,
}: InterruptMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const getSelectedOptions = () => {
    // Default to all three options if no config is provided
    if (!interruptConfig) {
      return ["accept", "respond", "edit"];
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
      allow_ignore: false, // always false as per requirements
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
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-sm text-gray-500"
        >
          {displayText}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {INTERRUPT_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() =>
                    !option.disabled && handleSelect(option.value)
                  }
                  className={`${option.disabled ? "cursor-not-allowed opacity-50" : ""} data-[selected]:bg-gray-50 data-[selected]:text-gray-500`}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedOptions.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  <span className="text-gray-500">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
