"use client";

import React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useTriggers,
  ListTriggerRegistrationsData,
} from "@/hooks/use-triggers";
import { groupUserRegisteredTriggersByProvider } from "@/lib/triggers";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { ResourceRenderer } from "@/components/ui/resource-renderer";
import { ConfigFieldProps } from "./types";
import { TriggersConfig } from "@/types/deep-agent";

export function ConfigFieldTriggers({
  className,
  value,
  setValue,
}: Pick<ConfigFieldProps<TriggersConfig>, "className" | "value" | "setValue">) {
  const auth = useAuthContext();
  const { listUserTriggers } = useTriggers();

  const [userTriggers, setUserTriggers] = React.useState<
    ListTriggerRegistrationsData[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const selectedTriggers = value || [];

  // Fetch user triggers on mount
  React.useEffect(() => {
    if (!auth.session?.accessToken || loading || userTriggers.length > 0)
      return;

    const fetchTriggers = async (accessToken: string) => {
      setLoading(true);
      try {
        const triggers = await listUserTriggers(accessToken);
        if (triggers) {
          setUserTriggers(triggers);
        }
      } catch (error) {
        console.error("Failed to fetch triggers:", error);
        toast.error("Failed to load triggers");
      } finally {
        setLoading(false);
      }
    };

    fetchTriggers(auth.session.accessToken);
  }, [auth.session?.accessToken, listUserTriggers]);

  const groupedTriggers = React.useMemo(() => {
    return groupUserRegisteredTriggersByProvider(userTriggers);
  }, [userTriggers]);

  const handleTriggerToggle = async (triggerId: string) => {
    const isSelected = selectedTriggers.includes(triggerId);
    const newSelectedTriggers = isSelected
      ? selectedTriggers.filter((id) => id !== triggerId)
      : [...selectedTriggers, triggerId];

    setValue(newSelectedTriggers);
  };

  const getSelectedTriggersDisplay = () => {
    if (selectedTriggers.length === 0) return "Select triggers...";

    const selectedTriggerObjects = userTriggers.filter((trigger) =>
      selectedTriggers.includes(trigger.id),
    );

    return (
      <div className="flex max-w-full flex-wrap gap-1">
        {selectedTriggerObjects.slice(0, 2).map((trigger) => (
          <Badge
            key={trigger.id}
            variant="secondary"
            className="text-xs"
          >
            {trigger.template_id}:{JSON.stringify(trigger.resource)}
          </Badge>
        ))}
        {selectedTriggers.length > 2 && (
          <Badge
            variant="secondary"
            className="text-xs"
          >
            +{selectedTriggers.length - 2} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-[40px] w-full justify-between p-3"
            disabled={loading}
          >
            <div className="flex flex-1 items-center gap-2">
              {loading ? (
                <span className="text-muted-foreground">
                  Loading triggers...
                </span>
              ) : (
                getSelectedTriggersDisplay()
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search triggers..." />
            <CommandList>
              <CommandEmpty>No triggers found.</CommandEmpty>
              {Object.entries(groupedTriggers).map(([provider, triggers]) => (
                <CommandGroup
                  key={provider}
                  heading={provider}
                >
                  {triggers.map((trigger) => (
                    <CommandItem
                      key={trigger.id}
                      onSelect={() => handleTriggerToggle(trigger.id)}
                      className="flex items-center space-x-2"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTriggers.includes(trigger.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <ResourceRenderer resource={trigger.resource} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTriggers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {userTriggers
            .filter((trigger) => selectedTriggers.includes(trigger.id))
            .map((trigger) => (
              <Badge
                key={trigger.id}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                <>
                  {trigger.template_id}:{JSON.stringify(trigger.resource)}
                  <TooltipIconButton
                    tooltip="Remove trigger"
                    onClick={() => handleTriggerToggle(trigger.id)}
                  >
                    <X className="hover:text-destructive h-3 w-3 cursor-pointer" />
                  </TooltipIconButton>
                </>
              </Badge>
            ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Select triggers to activate when this agent is used.
      </p>
    </div>
  );
}
