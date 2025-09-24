import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMCPContext } from "@/providers/MCP";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Loader2 } from "lucide-react";
import _ from "lodash";
import { Tool } from "@/types/tool";
import { useState } from "react";

interface ToolListCommandProps {
  value: Tool;
  setValue: (tool: Tool) => void;
  className?: string;
}

export function ToolListCommand({
  value,
  setValue,
  className,
}: ToolListCommandProps) {
  const [open, setOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { tools, loading, getTools, setTools, cursor } = useMCPContext();

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger
        asChild
        className={className}
      >
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[400px] justify-between"
        >
          {value ? _.startCase(value.name) : "Select a tool..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[400px] p-0">
        <Command
          filter={(value, search) => {
            if (!value) return 0;
            if (
              value.toLowerCase().includes(search.toLowerCase()) ||
              _.startCase(value).toLowerCase().includes(search.toLowerCase())
            ) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Search tools..." />
          <CommandList>
            <CommandEmpty>No tools found.</CommandEmpty>
            {loading && !tools.length && (
              <CommandEmpty className="flex items-center gap-1">
                <Loader2 className="size-4 animate-spin" />
                Loading tools...
              </CommandEmpty>
            )}
            {tools.map((tool, index) => (
              <CommandItem
                key={`${tool.name}:${index}`}
                value={tool.name}
                onSelect={() => {
                  setValue(tool);
                  setOpen(false);
                }}
              >
                {_.startCase(tool.name)}
              </CommandItem>
            ))}
            {cursor && (
              <div className="border-t p-1">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  disabled={loadingMore}
                  onClick={async () => {
                    setLoadingMore(true);
                    try {
                      const moreTool = await getTools(cursor);
                      setTools((prevTools) => [...prevTools, ...moreTool]);
                    } catch (error) {
                      console.error("Failed to load more tools:", error);
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
