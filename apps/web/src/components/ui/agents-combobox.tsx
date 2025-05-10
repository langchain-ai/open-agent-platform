"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Star, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Agent } from "@/types/agent";
import {
  groupAgentsByGraphs,
  isDefaultAssistant,
  sortAgentGroup,
} from "@/lib/agent-utils";
import { getDeployments } from "@/lib/environment/deployments";

export interface AgentsComboboxProps {
  agents: Agent[];
  agentsLoading: boolean;
  /**
   * The placeholder text to display when no value is selected.
   * @default "Select an agent..."
   */
  placeholder?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  /**
   * Single agent value (string) or multiple agent values (string[])
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
  className?: string;
  trigger?: React.ReactNode;
  triggerAsChild?: boolean;
}

/**
 * Returns the selected agent's name
 * @param value The value of the selected agent.
 * @param agents The array of agents.
 * @returns The name of the selected agent.
 */
const getSelectedAgentValue = (
  value: string,
  agents: Agent[],
): React.ReactNode => {
  const [selectedAssistantId, selectedDeploymentId] = value.split(":");
  const selectedAgent = agents.find(
    (item) =>
      item.assistant_id === selectedAssistantId &&
      item.deploymentId === selectedDeploymentId,
  );

  if (selectedAgent) {
    return (
      <span className="flex w-full items-center justify-between">
        {selectedAgent.name}
        {isDefaultAssistant(selectedAgent) && (
          <span className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
            <Star />
            <p>Default</p>
          </span>
        )}
      </span>
    );
  }
  return "";
};

/**
 * Returns a formatted display string for multiple selected agents
 * @param values Array of selected agent values
 * @param agents The array of agents
 * @returns Formatted string for display
 */
const getMultipleSelectedAgentValues = (
  values: string[],
  agents: Agent[],
): React.ReactNode => {
  if (values.length === 0) return "";
  if (values.length === 1) return getSelectedAgentValue(values[0], agents);
  return `${values.length} agents selected`;
};

const getNameFromValue = (value: string, agents: Agent[]) => {
  const [selectedAssistantId, selectedDeploymentId] = value.split(":");
  const selectedAgent = agents.find(
    (item) =>
      item.assistant_id === selectedAssistantId &&
      item.deploymentId === selectedDeploymentId,
  );

  if (selectedAgent) {
    return selectedAgent.name;
  }
  return "";
};

export function AgentsCombobox({
  agents,
  placeholder = "Select an agent...",
  open,
  setOpen,
  value,
  setValue,
  multiple = false,
  className,
  trigger,
  triggerAsChild,
  agentsLoading,
}: AgentsComboboxProps) {
  const deployments = getDeployments();

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
      } else {
        // Remove the value if already selected
        newValues.splice(index, 1);
      }

      setValue(newValues);
    } else {
      // For single selection mode (backward compatibility)
      setValue(currentValue === selectedValues[0] ? "" : currentValue);
      setOpen?.(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger
        asChild={triggerAsChild || !trigger}
        className={className}
      >
        {trigger || (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {selectedValues.length > 0
              ? multiple
                ? getMultipleSelectedAgentValues(selectedValues, agents)
                : getSelectedAgentValue(selectedValues[0], agents)
              : placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="min-w-[200px] p-0">
        <Command
          filter={(value: string, search: string) => {
            const name = getNameFromValue(value, agents);
            if (!name) return 0;
            if (name.toLowerCase().includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Search agents..." />
          <CommandList>
            <CommandEmpty>
              {agentsLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading agents...
                </span>
              ) : (
                "No agents found."
              )}
            </CommandEmpty>
            {deployments.map((deployment) => {
              // Filter agents for the current deployment (excluding default agents)
              const deploymentAgents = agents.filter(
                (agent) => agent.deploymentId === deployment.id,
              );
              // Group filtered agents by graph (still needed for sorting/grouping logic)
              const agentsGroupedByGraphs =
                groupAgentsByGraphs(deploymentAgents);

              // Flatten the groups for rendering directly under deployment group
              const allDeploymentAgents = agentsGroupedByGraphs.flatMap(
                (group) => sortAgentGroup(group),
              ); // Flatten and sort

              // Only render the deployment group if it has agents
              if (allDeploymentAgents.length === 0) {
                return null;
              }

              return (
                <React.Fragment key={deployment.id}>
                  <CommandGroup
                    heading={deployment.name} // Use deployment name as heading
                    className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
                  >
                    {/* Map over ALL agents for this deployment directly */}
                    {allDeploymentAgents.map((item) => {
                      const itemValue = `${item.assistant_id}:${item.deploymentId}`;
                      const isSelected = selectedValues.includes(itemValue);

                      return (
                        <CommandItem
                          key={itemValue}
                          value={itemValue}
                          onSelect={handleSelect}
                          className="flex w-full items-center justify-between"
                        >
                          {/* Prepend Graph ID to the name for visual grouping */}
                          <p className="line-clamp-1 flex-1 truncate pr-2">
                            <span className="text-muted-foreground mr-2 text-xs">{`[${item.graph_id}]`}</span>
                            {item.name}
                          </p>
                          <div className="flex flex-shrink-0 items-center justify-end gap-2">
                            {isDefaultAssistant(item) && (
                              <span className="text-muted-foreground flex items-center gap-2 text-xs">
                                <Star />
                                <p>Default</p>
                              </span>
                            )}
                            <Check
                              className={cn(
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                </React.Fragment>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
