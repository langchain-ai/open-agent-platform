"use client";

import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { useRagContext } from "@/features/rag/providers/RAG";
import {
  Check,
  ChevronsUpDown,
  AlertCircle,
  Plus,
  X,
  OctagonPause,
} from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import _ from "lodash";
import { cn } from "@/lib/utils";
import {
  ConfigurableFieldAgentsMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldSubAgentsMetadata,
  ConfigurableFieldTriggersMetadata,
} from "@/types/configurable";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
import { ToolsCombobox } from "@/components/ui/tools-combobox";
import { useAgentsContext } from "@/providers/Agents";
import { Tool } from "@/types/tool";
import { getDeployments } from "@/lib/environment/deployments";
import { useTriggers, ListUserTriggersData } from "@/hooks/use-triggers";
import { groupUserRegisteredTriggersByProvider } from "@/lib/environment/triggers";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { InterruptConfigDialog } from "./interrupt-config-dialog";

interface Option {
  label: string;
  value: string;
}

interface ConfigFieldProps {
  id: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "switch"
    | "slider"
    | "select"
    | "json";
  description?: string;
  placeholder?: string;
  options?: Option[];
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  // Optional props for external state management
  value?: any;
  setValue?: (value: any) => void;
  agentId: string;
}

export function ConfigField({
  id,
  label,
  type,
  description,
  placeholder,
  options = [],
  min,
  max,
  step = 1,
  className,
  value: externalValue, // Rename to avoid conflict
  setValue: externalSetValue, // Rename to avoid conflict
  agentId,
}: ConfigFieldProps) {
  const store = useConfigStore();
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Determine whether to use external state or Zustand store
  const isExternallyManaged = externalSetValue !== undefined;

  const currentValue = isExternallyManaged
    ? externalValue
    : store.configsByAgentId[agentId][id];

  const handleChange = (newValue: any) => {
    setJsonError(null); // Clear JSON error on any change
    if (isExternallyManaged && externalSetValue) {
      externalSetValue(newValue); // Use non-null assertion as we checked existence
    } else {
      store.updateConfig(agentId, id, newValue);
    }
  };

  const handleJsonChange = (jsonString: string) => {
    try {
      if (!jsonString.trim()) {
        handleChange(undefined); // Use the unified handleChange
        setJsonError(null);
        return;
      }

      // Attempt to parse for validation first
      const parsedJson = JSON.parse(jsonString);
      // If parsing succeeds, call handleChange with the raw string and clear error
      handleChange(parsedJson); // Use the unified handleChange
      setJsonError(null);
    } catch (_) {
      // If parsing fails, update state with invalid string but set error
      // This allows the user to see their invalid input and the error message
      if (isExternallyManaged && externalSetValue) {
        externalSetValue(jsonString);
      } else {
        store.updateConfig(agentId, id, jsonString);
      }
      setJsonError("Invalid JSON format");
    }
  };

  const handleFormatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      // Directly use handleChange to update with the formatted string
      handleChange(parsed);
      setJsonError(null); // Clear error on successful format
    } catch (_) {
      // If formatting fails (because input is not valid JSON), set the error state
      // Do not change the underlying value that failed to parse/format
      setJsonError("Invalid JSON format");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label
          htmlFor={id}
          className="text-sm font-medium"
        >
          {_.startCase(label)}
        </Label>
        {type === "switch" && (
          <Switch
            id={id}
            checked={!!currentValue} // Use currentValue
            onCheckedChange={handleChange}
          />
        )}
      </div>

      {description && (
        <p className="text-xs whitespace-pre-line text-gray-500">
          {description}
        </p>
      )}

      {type === "text" && (
        <Input
          id={id}
          value={currentValue || ""} // Use currentValue
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      )}

      {type === "textarea" && (
        <Textarea
          id={id}
          value={currentValue || ""} // Use currentValue
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px]"
        />
      )}

      {type === "number" && (
        <Input
          id={id}
          type="number"
          value={currentValue !== undefined ? currentValue : ""} // Use currentValue
          onChange={(e) => {
            // Handle potential empty string or invalid number input
            const val = e.target.value;
            if (val === "") {
              handleChange(undefined); // Treat empty string as clearing the value
            } else {
              const num = Number(val);
              // Only call handleChange if it's a valid number
              if (!isNaN(num)) {
                handleChange(num);
              }
              // If not a valid number (e.g., '1.2.3'), do nothing, keep the last valid state
            }
          }}
          min={min}
          max={max}
          step={step}
        />
      )}

      {type === "slider" && (
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">{min ?? ""}</span>
            <span className="text-sm font-medium">
              {/* Use currentValue */}
              {currentValue !== undefined
                ? currentValue
                : min !== undefined && max !== undefined
                  ? (min + max) / 2
                  : ""}
            </span>
            <span className="text-xs text-gray-500">{max ?? ""}</span>
          </div>
          <Slider
            id={id}
            // Use currentValue, provide default based on min/max if undefined
            value={[
              currentValue !== undefined
                ? currentValue
                : min !== undefined && max !== undefined
                  ? (min + max) / 2
                  : 0,
            ]}
            min={min}
            max={max}
            step={step}
            onValueChange={(vals) => handleChange(vals[0])}
            disabled={min === undefined || max === undefined} // Disable slider if min/max not provided
          />
        </div>
      )}

      {type === "select" && (
        <Select
          value={currentValue ?? ""} // Use currentValue, provide default empty string if undefined/null
          onValueChange={handleChange}
        >
          <SelectTrigger>
            {/* Display selected value or placeholder */}
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "json" && (
        <>
          <Textarea
            id={id}
            value={
              typeof currentValue === "string"
                ? currentValue
                : (JSON.stringify(currentValue, null, 2) ?? "")
            } // Use currentValue
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder={placeholder || '{\n  "key": "value"\n}'}
            className={cn(
              "min-h-[120px] font-mono text-sm",
              jsonError &&
                "border-red-500 focus:border-red-500 focus-visible:ring-red-500", // Add error styling
            )}
          />
          <div className="flex w-full items-start justify-between gap-2 pt-1">
            {" "}
            {/* Use items-start */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFormatJson(currentValue ?? "")}
              // Disable if value is empty, not a string, or already has a JSON error
              disabled={
                !currentValue || typeof currentValue !== "string" || !!jsonError
              }
              className="mt-1" // Add margin top to align better with textarea
            >
              Format
            </Button>
            {jsonError && (
              <Alert
                variant="destructive"
                className="flex-grow px-3 py-1" // Adjusted styling
              >
                <div className="flex items-center gap-2">
                  {" "}
                  {/* Ensure icon and text are aligned */}
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />{" "}
                  {/* Added flex-shrink-0 */}
                  <AlertDescription className="text-xs">
                    {jsonError}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ConfigFieldTool({
  id,
  label,
  description,
  agentId,
  className,
  toolId,
  value: externalValue, // Rename to avoid conflict
  setValue: externalSetValue, // Rename to avoid conflict
}: Pick<
  ConfigFieldProps,
  | "id"
  | "label"
  | "description"
  | "agentId"
  | "className"
  | "value"
  | "setValue"
> & { toolId: string }) {
  const store = useConfigStore();
  const actualAgentId = `${agentId}:selected-tools`;
  const [interruptDialogOpen, setInterruptDialogOpen] = useState(false);

  const isExternallyManaged = externalSetValue !== undefined;

  const defaults = (
    isExternallyManaged
      ? externalValue
      : store.configsByAgentId[actualAgentId]?.[toolId]
  ) as ConfigurableFieldMCPMetadata["default"] | undefined;

  if (!defaults) {
    return null;
  }

  const checked = defaults.tools?.some((t) => t === label);

  const handleCheckedChange = (checked: boolean) => {
    const newValue = checked
      ? {
          ...defaults,
          // Remove duplicates
          tools: Array.from(
            new Set<string>([...(defaults.tools || []), label]),
          ),
        }
      : {
          ...defaults,
          tools: defaults.tools?.filter((t) => t !== label),
        };

    if (isExternallyManaged) {
      externalSetValue(newValue);
      return;
    }

    store.updateConfig(actualAgentId, toolId, newValue);
  };

  return (
    <>
      <div className={cn("w-full space-y-2", className)}>
        <div className="flex items-center justify-between">
          <Label
            htmlFor={id}
            className="text-sm font-medium"
          >
            {_.startCase(label)}
          </Label>
          <div className="flex items-center gap-2">
            <TooltipIconButton
              tooltip="Configure interrupts"
              onClick={() => setInterruptDialogOpen(true)}
              disabled={!checked}
              variant="ghost"
              type="button"
            >
              <OctagonPause className="h-4 w-4" />
            </TooltipIconButton>
            <Switch
              id={id}
              checked={checked} // Use currentValue
              onCheckedChange={handleCheckedChange}
            />
          </div>
        </div>

        {description && (
          <p className="text-xs whitespace-pre-line text-gray-500">
            {description}
          </p>
        )}
      </div>

      <InterruptConfigDialog
        open={interruptDialogOpen}
        onOpenChange={setInterruptDialogOpen}
      />
    </>
  );
}

export function ConfigFieldRAG({
  id,
  label,
  agentId,
  className,
  value: externalValue, // Rename to avoid conflict
  setValue: externalSetValue, // Rename to avoid conflict
}: Pick<
  ConfigFieldProps,
  "id" | "label" | "agentId" | "className" | "value" | "setValue"
>) {
  const { collections } = useRagContext();
  const store = useConfigStore();
  const actualAgentId = `${agentId}:rag`;
  const [open, setOpen] = useState(false);

  const isExternallyManaged = externalSetValue !== undefined;

  const defaults = (
    isExternallyManaged
      ? externalValue
      : store.configsByAgentId[actualAgentId]?.[label]
  ) as ConfigurableFieldRAGMetadata["default"];

  if (!defaults) {
    return null;
  }

  const selectedCollections = defaults.collections?.length
    ? defaults.collections
    : [];

  const handleSelect = (collectionId: string) => {
    const newValue = selectedCollections.some((s) => s === collectionId)
      ? selectedCollections.filter((s) => s !== collectionId)
      : [...selectedCollections, collectionId];

    if (isExternallyManaged) {
      externalSetValue({
        ...defaults,
        collections: Array.from(new Set(newValue)),
      });
      return;
    }

    store.updateConfig(actualAgentId, label, {
      ...defaults,
      collections: Array.from(new Set(newValue)),
    });
  };

  const getCollectionNameFromId = (collectionId: string) => {
    const collection = collections.find((c) => c.uuid === collectionId);
    return collection?.name ?? "Unknown Collection";
  };

  return (
    <div className={cn("flex w-full flex-col items-start gap-2", className)}>
      <Label
        htmlFor={id}
        className="text-sm font-medium"
      >
        Selected Collections
      </Label>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCollections.length > 0
              ? selectedCollections.length > 1
                ? `${selectedCollections.length} collections selected`
                : getCollectionNameFromId(selectedCollections[0])
              : "Select collections"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          align="start"
        >
          <Command className="w-full">
            <CommandInput placeholder="Search collections..." />
            <CommandList>
              <CommandEmpty>No collections found.</CommandEmpty>
              <CommandGroup>
                {collections.map((collection) => (
                  <CommandItem
                    key={collection.uuid}
                    value={collection.uuid}
                    onSelect={() => handleSelect(collection.uuid)}
                    className="flex items-center justify-between"
                  >
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCollections.includes(collection.uuid)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <p className="line-clamp-1 flex-1 truncate pr-2">
                      {collection.name}
                    </p>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ConfigFieldAgents({
  label,
  agentId,
  className,
  value: externalValue, // Rename to avoid conflict
  setValue: externalSetValue, // Rename to avoid conflict
}: Pick<
  ConfigFieldProps,
  | "id"
  | "label"
  | "description"
  | "agentId"
  | "className"
  | "value"
  | "setValue"
>) {
  const store = useConfigStore();
  const actualAgentId = `${agentId}:agents`;

  const { agents, loading } = useAgentsContext();
  const deployments = getDeployments();

  // Do not allow adding itself as a sub-agent
  const filteredAgents = agents.filter((a) => a.assistant_id !== agentId);

  const isExternallyManaged = externalSetValue !== undefined;

  const defaults = (
    isExternallyManaged
      ? externalValue
      : store.configsByAgentId[actualAgentId]?.[label]
  ) as ConfigurableFieldAgentsMetadata["default"] | undefined;

  if (!defaults) {
    return null;
  }

  const handleSelectChange = (ids: string[]) => {
    if (!ids.length || ids.every((id) => !id)) {
      if (isExternallyManaged) {
        externalSetValue([]);
        return;
      }

      store.updateConfig(actualAgentId, label, []);
      return;
    }

    const newDefaults = ids.map((id) => {
      const [agent_id, deploymentId] = id.split(":");
      const deployment_url = deployments.find(
        (d) => d.id === deploymentId,
      )?.deploymentUrl;
      if (!deployment_url) {
        toast.error("Deployment not found");
      }

      return {
        agent_id,
        deployment_url,
        name: agents.find((a) => a.assistant_id === agent_id)?.name,
      };
    });

    if (isExternallyManaged) {
      externalSetValue(newDefaults);
      return;
    }

    store.updateConfig(actualAgentId, label, newDefaults);
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <AgentsCombobox
        agents={filteredAgents}
        agentsLoading={loading}
        value={defaults.map(
          (defaultValue) =>
            `${defaultValue.agent_id}:${deployments.find((d) => d.deploymentUrl === defaultValue.deployment_url)?.id}`,
        )}
        setValue={(v) =>
          Array.isArray(v) ? handleSelectChange(v) : handleSelectChange([v])
        }
        multiple
        className="w-full"
      />

      <p className="text-xs text-gray-500">
        The agents to make available to this supervisor.
      </p>
    </div>
  );
}

interface ToolsFieldProps {
  agentIndex: number;
  tools: string[];
  updateSubAgent: (index: number, field: string, value: any) => void;
  toolsLoading: boolean;
  displayTools: Tool[];
  toolSearchTerm: string;
  debouncedSetSearchTerm: (value: string) => void;
  loadingMore: boolean;
  onLoadMore?: () => void;
  hasMore: boolean;
}

function ToolsField({
  agentIndex,
  tools,
  updateSubAgent,
  toolsLoading,
  displayTools,
  toolSearchTerm,
  debouncedSetSearchTerm,
  loadingMore,
  onLoadMore,
  hasMore,
}: ToolsFieldProps) {
  const handleToolsChange = (selectedTools: string | string[]) => {
    const toolsArray = Array.isArray(selectedTools)
      ? selectedTools
      : [selectedTools];
    updateSubAgent(agentIndex, "tools", toolsArray);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">Tools</Label>
      <ToolsCombobox
        tools={displayTools}
        toolsLoading={toolsLoading}
        value={tools}
        setValue={handleToolsChange}
        multiple={true}
        placeholder="Select tools..."
        className="text-sm"
        searchTerm={toolSearchTerm}
        onSearchChange={debouncedSetSearchTerm}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
      />
    </div>
  );
}

interface ConfigFieldSubAgentsProps
  extends Pick<
    ConfigFieldProps,
    | "id"
    | "label"
    | "description"
    | "agentId"
    | "className"
    | "value"
    | "setValue"
  > {
  // Pagination and tool management props
  availableTools?: Tool[];
  toolsLoading?: boolean;
  displayTools?: Tool[];
  toolSearchTerm?: string;
  debouncedSetSearchTerm?: (value: string) => void;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  selectedMainTools?: string[];
}

export function ConfigFieldSubAgents({
  label,
  agentId,
  className,
  value: externalValue,
  setValue: externalSetValue,
  availableTools,
  toolsLoading,
  displayTools,
  toolSearchTerm,
  debouncedSetSearchTerm,
  loadingMore,
  onLoadMore,
  hasMore,
  selectedMainTools = [],
}: ConfigFieldSubAgentsProps) {
  const store = useConfigStore();
  const actualAgentId = `${agentId}:sub_agents`;

  const isExternallyManaged = externalSetValue !== undefined;

  const defaults = (
    isExternallyManaged
      ? externalValue
      : store.configsByAgentId[actualAgentId]?.[label]
  ) as ConfigurableFieldSubAgentsMetadata["default"] | undefined;

  if (!defaults) {
    return null;
  }

  const subAgents = defaults || [];

  const addSubAgent = () => {
    const newSubAgent = {
      name: "",
      description: "",
      prompt: "",
      tools: [...selectedMainTools], // Pre-populate with selected main tools
      mcp_server: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
    };

    const newSubAgents = [...subAgents, newSubAgent];

    if (isExternallyManaged) {
      externalSetValue(newSubAgents);
      return;
    }

    store.updateConfig(actualAgentId, label, newSubAgents);
  };

  const removeSubAgent = (index: number) => {
    const newSubAgents = subAgents.filter((_, i) => i !== index);

    if (isExternallyManaged) {
      externalSetValue(newSubAgents);
      return;
    }

    store.updateConfig(actualAgentId, label, newSubAgents);
  };

  const updateSubAgent = (index: number, field: string, value: any) => {
    const newSubAgents = subAgents.map((agent, i) =>
      i === index ? { ...agent, [field]: value } : agent,
    );

    if (isExternallyManaged) {
      externalSetValue(newSubAgents);
      return;
    }

    store.updateConfig(actualAgentId, label, newSubAgents);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Sub Agents</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSubAgent}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Agent
        </Button>
      </div>

      <div className="space-y-4">
        {subAgents.map((subAgent, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Agent {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSubAgent(index)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Name Field */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Name</Label>
                <Input
                  value={subAgent.name || ""}
                  onChange={(e) =>
                    updateSubAgent(index, "name", e.target.value)
                  }
                  placeholder="Enter agent name"
                  className="text-sm"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={subAgent.description || ""}
                  onChange={(e) =>
                    updateSubAgent(index, "description", e.target.value)
                  }
                  placeholder="Enter agent description"
                  className="min-h-[60px] text-sm"
                />
              </div>

              {/* Prompt Field */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Prompt</Label>
                <Textarea
                  value={subAgent.prompt || ""}
                  onChange={(e) =>
                    updateSubAgent(index, "prompt", e.target.value)
                  }
                  placeholder="Enter agent prompt"
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Tools Field */}
              <ToolsField
                agentIndex={index}
                tools={subAgent.tools || []}
                updateSubAgent={updateSubAgent}
                toolsLoading={toolsLoading || false}
                displayTools={displayTools || availableTools || []}
                toolSearchTerm={toolSearchTerm || ""}
                debouncedSetSearchTerm={debouncedSetSearchTerm || (() => {})}
                loadingMore={loadingMore || false}
                onLoadMore={onLoadMore}
                hasMore={hasMore || false}
              />
            </div>
          </div>
        ))}
      </div>

      {subAgents.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          <p className="text-sm">No sub agents configured</p>
          <p className="text-xs">
            Click "Add Agent" to create your first sub agent
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Create custom agents with specific prompts and tools for specialized
        tasks.
      </p>
    </div>
  );
}

type ConfigFieldTriggersProps = Pick<
  ConfigFieldProps,
  | "id"
  | "label"
  | "description"
  | "agentId"
  | "className"
  | "value"
  | "setValue"
>;

export function ConfigFieldTriggers({
  label,
  agentId,
  className,
  value: externalValue,
  setValue: externalSetValue,
}: ConfigFieldTriggersProps) {
  const store = useConfigStore();
  const actualAgentId = `${agentId}:triggers`;
  const auth = useAuthContext();
  const { listUserTriggers } = useTriggers();

  const [userTriggers, setUserTriggers] = React.useState<
    ListUserTriggersData[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const isExternallyManaged = externalSetValue !== undefined;

  const defaults = (
    isExternallyManaged
      ? externalValue
      : store.configsByAgentId[actualAgentId]?.[label]
  ) as ConfigurableFieldTriggersMetadata["default"] | undefined;

  const selectedTriggers = defaults || [];

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

    if (isExternallyManaged) {
      externalSetValue(newSelectedTriggers);
    } else {
      store.updateConfig(actualAgentId, label, newSelectedTriggers);
    }
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
            {trigger.provider_id}:{trigger.resource_id}
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
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {trigger.resource_id}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {trigger.provider_id}
                        </span>
                      </div>
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
                  {trigger.provider_id}:{trigger.resource_id}
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
