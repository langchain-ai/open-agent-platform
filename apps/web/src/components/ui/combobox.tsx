import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandGroup, CommandItem, CommandList } from "./command";
import { ReactNode } from "react";

interface ComboboxProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  displayText: string;
  options: { value: string; label: string; disabled?: boolean }[];
  selectedOptions?: string[];
  optionRenderer?: (option: { value: string; label: string }) => ReactNode;
  onSelect?: (value: string) => void;
}

export function Combobox({
  open,
  onOpenChange,
  displayText,
  options,
  selectedOptions,
  optionRenderer,
  onSelect,
}: ComboboxProps) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
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
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => !option.disabled && onSelect?.(option.value)}
                  className={cn(
                    "data-[selected]:bg-gray-50 data-[selected]:text-gray-500",
                    option.disabled ? "cursor-not-allowed opacity-50" : "",
                  )}
                >
                  {optionRenderer ? (
                    optionRenderer(option)
                  ) : (
                    <>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedOptions?.includes(option.value)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span className="text-gray-500">{option.label}</span>
                    </>
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
