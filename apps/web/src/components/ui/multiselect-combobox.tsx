"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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

export interface MultiselectComboboxProps {
  /**
   * Available options to select from
   */
  options: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  /**
   * The placeholder text to display when no value is selected.
   * @default "Select options..."
   */
  placeholder?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  /**
   * Single value (string) or multiple values (string[])
   */
  value?: string | string[];
  /**
   * Callback for setting the value
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
}

export function MultiselectCombobox({
  options,
  placeholder = "Select options...",
  open: controlledOpen,
  setOpen: setControlledOpen,
  value,
  setValue,
  multiple = false,
  disableDeselect = false,
  className,
  style,
  trigger,
}: MultiselectComboboxProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  // Normalize value to array for consistent handling
  const selectedValues = React.useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    if (!multiple) {
      // Single select mode
      setValue?.(selectedValue);
      setOpen(false);
      return;
    }

    // Multiple select mode
    const isSelected = selectedValues.includes(selectedValue);

    if (isSelected && disableDeselect && selectedValues.length === 1) {
      // Don't allow deselecting the last item if disableDeselect is true
      return;
    }

    const newValues = isSelected
      ? selectedValues.filter((v) => v !== selectedValue)
      : [...selectedValues, selectedValue];

    setValue?.(newValues);
  };

  const displayText = React.useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      return options.find((opt) => opt.value === selectedValues[0])?.label || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  }, [selectedValues, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            style={style}
          >
            {displayText}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {multiple && (
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        selectedValues.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
