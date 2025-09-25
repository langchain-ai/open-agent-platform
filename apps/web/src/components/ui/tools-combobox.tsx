"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tool } from "@/types/tool";

export interface ToolsComboboxProps {
  tools: Tool[];
  toolsLoading?: boolean;
  /**
   * The placeholder text to display when no value is selected.
   * @default "Select a tool..."
   */
  placeholder?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  /**
   * Single tool value (string) or multiple tool values (string[])
   */
  value?: string | string[];
  /**
   * Callback for setting the value. Accepts a string for single selection or string[] for multiple selection.
   */
  setValue?: (value: string | string[]) => void;
  /**
   * Enable multiple selection mode
   * @default false
   */
  multiple?: boolean;
  /**
   * Prevent deselection of selected values
   * @default false
   */
  disableDeselect?: boolean;
  className?: string;
  style?: React.CSSProperties;
  trigger?: React.ReactNode;
  triggerAsChild?: boolean;
  footer?: React.ReactNode;
  /**
   * Search term for filtering tools
   */
  searchTerm?: string;
  /**
   * Callback for search term changes
   */
  onSearchChange?: (value: string) => void;
  /**
   * Whether more tools are being loaded
   */
  loadingMore?: boolean;
  /**
   * Callback to load more tools
   */
  onLoadMore?: () => void;
  /**
   * Whether there are more tools available to load
   */
  hasMore?: boolean;
}

/**
 * Returns the selected tool's name
 * @param value The value of the selected tool.
 * @param tools The array of tools.
 * @returns The name of the selected tool.
 */
const getSelectedToolValue = (
  value: string,
  tools: Tool[],
): React.ReactNode => {
  const selectedTool = tools.find((tool) => tool.name === value);

  if (selectedTool) {
    return (
      <span className="flex w-full items-center gap-2">
        {selectedTool.name}
      </span>
    );
  }
  return "";
};

/**
 * Returns tool cards for multiple selected tools
 * @param values Array of selected tool values
 * @param tools The array of tools
 * @param onRemove Callback to remove a tool
 * @returns Tool cards for display
 */
const getMultipleSelectedToolCards = (
  values: string[],
  tools: Tool[],
  onRemove: (toolName: string) => void,
): React.ReactNode => {
  if (values.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 p-1">
      {values.map((value) => {
        const tool = tools.find((t) => t.name === value);
        if (!tool) return null;

        return (
          <div
            key={value}
            className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
          >
            <span className="max-w-[120px] truncate">{tool.name}</span>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(value);
                }
              }}
              className="flex-shrink-0 cursor-pointer rounded-sm p-0.5 transition-colors hover:bg-blue-100"
            >
              <X className="h-3 w-3" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const getNameFromValue = (value: string, tools: Tool[]) => {
  const selectedTool = tools.find((tool) => tool.name === value);
  return selectedTool?.name || "";
};

export function ToolsCombobox({
  tools,
  placeholder = "Select a tool...",
  open,
  setOpen,
  value,
  setValue,
  multiple = false,
  disableDeselect = false,
  className,
  trigger,
  triggerAsChild,
  footer,
  style,
  toolsLoading,
  searchTerm,
  onSearchChange,
  loadingMore,
  onLoadMore,
  hasMore,
}: ToolsComboboxProps) {
  // Convert value to array for internal handling
  const selectedValues = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Handle selection of an item
  const handleSelect = (currentValue: string) => {
    if (!setValue) return;

    if (multiple) {
      // For multiple selection mode
      const newValues = [...selectedValues];
      const index = newValues.indexOf(currentValue);

      if (index === -1) {
        // Add the value if not already selected
        newValues.push(currentValue);
      } else if (!disableDeselect) {
        // Remove the value if already selected (only if deselection is allowed)
        newValues.splice(index, 1);
      }

      setValue(newValues);
    } else {
      // For single selection mode (backward compatibility)
      const shouldDeselect =
        currentValue === selectedValues[0] && !disableDeselect;
      setValue(shouldDeselect ? "" : currentValue);
      setOpen?.(false);
    }
  };

  // Handle removing a tool from selection
  const handleRemoveTool = (toolName: string) => {
    if (!setValue || !multiple) return;

    const newValues = selectedValues.filter((value) => value !== toolName);
    setValue(newValues);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild={triggerAsChild || !trigger}>
        {trigger || (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-auto min-h-[40px] min-w-[200px] justify-start p-1",
              selectedValues.length > 0 && multiple
                ? "items-start"
                : "items-center justify-between",
              className,
            )}
            style={style}
          >
            <div className="flex w-full flex-1 items-center justify-between">
              {selectedValues.length > 0 ? (
                multiple ? (
                  <div className="min-w-0 flex-1">
                    {getMultipleSelectedToolCards(
                      selectedValues,
                      tools,
                      handleRemoveTool,
                    )}
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    {getSelectedToolValue(selectedValues[0], tools)}
                  </div>
                )
              ) : (
                <span className="text-muted-foreground flex-1 text-left">
                  {placeholder}
                </span>
              )}
              <ChevronsUpDown className="ml-2 flex-shrink-0 opacity-50" />
            </div>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-full min-w-[200px] p-0"
      >
        <Command
          filter={(value: string, search: string) => {
            const name = getNameFromValue(value, tools);
            if (!name) return 0;
            if (name.toLowerCase().includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput
            placeholder="Search tools..."
            value={searchTerm}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {toolsLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading tools...
                </span>
              ) : (
                "No tools found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {tools.map((tool) => {
                const isSelected = selectedValues.includes(tool.name);

                return (
                  <CommandItem
                    key={tool.name}
                    value={tool.name}
                    onSelect={handleSelect}
                    className="flex w-full items-center"
                  >
                    <Check
                      className={cn(
                        "flex-shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />

                    <div className="flex flex-1 flex-col gap-1 min-w-0 ml-2">
                      <p className="line-clamp-1 truncate font-medium">
                        {tool.name}
                      </p>
                      {tool.description && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {tool.description}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
              {loadingMore && (
                <CommandItem
                  disabled
                  className="flex items-center justify-center gap-2"
                >
                  <Loader2 className="size-4 animate-spin" />
                  Loading more tools...
                </CommandItem>
              )}
              {onLoadMore && !loadingMore && hasMore && tools.length > 0 && (
                <CommandItem
                  onSelect={() => {}}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onLoadMore();
                  }}
                  className="flex cursor-pointer items-center justify-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  Load more tools...
                </CommandItem>
              )}
            </CommandGroup>

            {footer}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
