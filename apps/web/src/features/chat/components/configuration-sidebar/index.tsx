"use client";

import { useEffect, forwardRef, ForwardedRef, useState } from "react";
import {
  Lightbulb,
  Save,
  Trash2,
  X,
  ChevronDown,
  Search as SearchIcon,
  RotateCcw,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ConfigField,
  ConfigFieldAgents,
  ConfigFieldRAG,
} from "@/features/chat/components/configuration-sidebar/config-field";
import { ConfigSection } from "@/features/chat/components/configuration-sidebar/config-section";
import { ToolGroupSection } from "@/features/chat/components/configuration-sidebar/tool-group-section";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgents } from "@/hooks/use-agents";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import _ from "lodash";
import { useMCPContext } from "@/providers/MCP";
import { Search } from "@/components/ui/tool-search";
import { useSearchTools } from "@/hooks/use-search-tools";
import { useFetchPreselectedTools } from "@/hooks/use-fetch-preselected-tools";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { useAgentsContext } from "@/providers/Agents";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isUserCreatedDefaultAssistant } from "@/lib/agent-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocalStorage } from "@/hooks/use-local-storage";

function NameAndDescriptionAlertDialog({
  name,
  setName,
  description,
  setDescription,
  open,
  setOpen,
  handleSave,
}: {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSave: () => void;
}) {
  const handleSaveAgent = () => {
    setOpen(false);
    handleSave();
  };
  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Agent Name and Description</AlertDialogTitle>
          <AlertDialogDescription>
            Please give your new agent a name and optional description.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              placeholder="Agent Name"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              placeholder="Agent Description"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSaveAgent}>
            Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface AIConfigPanelProps {
  className?: string;
  open: boolean;
}

export const ConfigurationSidebar = forwardRef<
  HTMLDivElement,
  AIConfigPanelProps
>(({ className, open }, ref: ForwardedRef<HTMLDivElement>) => {
  const {
    configsByAgentId,
    resetConfig,
    updateConfig,
    savePreset,
    loadPreset,
    deletePreset,
    getPresets,
  } = useConfigStore();
  const { tools, setTools, getTools, cursor } = useMCPContext();
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");
  const [threadId] = useQueryState("threadId");
  const { agents, refreshAgentsLoading } = useAgentsContext();
  const {
    getSchemaAndUpdateConfig,
    configurations,
    toolConfigurations,
    ragConfigurations,
    agentsConfigurations,
    loading,
    supportedConfigs,
  } = useAgentConfig();
  const { updateAgent, createAgent } = useAgents();

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [
    openNameAndDescriptionAlertDialog,
    setOpenNameAndDescriptionAlertDialog,
  ] = useState(false);

  const { toolSearchTerm, debouncedSetSearchTerm, displayTools } =
    useSearchTools(tools, {
      preSelectedTools: toolConfigurations[0]?.default?.tools,
    });
  const { loadingMore, setLoadingMore } = useFetchPreselectedTools({
    tools,
    setTools,
    getTools,
    cursor,
    toolConfigurations,
    searchTerm: toolSearchTerm,
  });

  const [showProTipAlert, setShowProTipAlert] = useLocalStorage(
    "showProTipAlert",
    true,
  );

  // Config panel enhancements: search, grouping, and presets
  const [configSearchTerm, setConfigSearchTerm] = useState("");
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  useEffect(() => {
    if (
      !agentId ||
      !deploymentId ||
      loading ||
      !agents?.length ||
      refreshAgentsLoading
    )
      return;

    const selectedAgent = agents.find(
      (a) => a.assistant_id === agentId && a.deploymentId === deploymentId,
    );
    if (!selectedAgent) {
      toast.error("Failed to get agent config.", { richColors: true });
      return;
    }

    getSchemaAndUpdateConfig(selectedAgent);
  }, [agentId, deploymentId, agents, refreshAgentsLoading]);

  const handleSave = async () => {
    if (!agentId || !deploymentId || !agents?.length) return;
    const selectedAgent = agents.find(
      (a) => a.assistant_id === agentId && a.deploymentId === deploymentId,
    );
    if (!selectedAgent) {
      toast.error("Failed to save config.", {
        richColors: true,
        description: "Unable to find selected agent.",
      });
      return;
    }
    if (isUserCreatedDefaultAssistant(selectedAgent) && !newName) {
      setOpenNameAndDescriptionAlertDialog(true);
      return;
    } else if (isUserCreatedDefaultAssistant(selectedAgent) && newName) {
      const newAgent = await createAgent(deploymentId, selectedAgent.graph_id, {
        name: newName,
        description: newDescription,
        config: configsByAgentId[agentId],
      });
      if (!newAgent) {
        toast.error("Failed to create agent", { richColors: true });
        return;
      }
      // Reload the page, using the new assistant ID and deployment ID
      const newQueryParams = new URLSearchParams({
        agentId: newAgent.assistant_id,
        deploymentId,
        ...(threadId ? { threadId } : {}),
      });
      window.location.href = `/?${newQueryParams.toString()}`;
      return;
    }

    const updatedAgent = await updateAgent(agentId, deploymentId, {
      config: configsByAgentId[agentId],
    });
    if (!updatedAgent) {
      toast.error("Failed to update agent configuration");
      return;
    }

    toast.success("Agent configuration saved successfully");
  };

  return (
    <div
      ref={ref}
      className={cn(
        "fixed top-0 right-0 z-10 h-screen border-l border-gray-200 bg-white shadow-lg transition-all duration-300",
        open ? "w-80 md:w-xl" : "w-0 overflow-hidden border-l-0",
        className,
      )}
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold">Agent Configuration</h2>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!agentId) return;
                        resetConfig(agentId);
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset the configuration to the last saved state</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="mr-1 h-4 w-4" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save your changes to the agent</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {showProTipAlert && (
            <div className="p-4">
              <Alert variant="info">
                <Lightbulb className="size-4" />
                <AlertTitle>
                  Pro Tip
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-2 hover:bg-transparent"
                    onClick={() => setShowProTipAlert(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  Changes made to the configuration will be saved automatically,
                  but will only persist across sessions if you click "Save".
                </AlertDescription>
              </Alert>
            </div>
          )}
          <Tabs
            defaultValue="general"
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <TabsList className="flex-shrink-0 justify-start bg-transparent px-4 pt-2">
              <TabsTrigger value="general">General</TabsTrigger>
              {supportedConfigs.includes("tools") && (
                <TabsTrigger value="tools">Tools</TabsTrigger>
              )}
              {supportedConfigs.includes("rag") && (
                <TabsTrigger value="rag">RAG</TabsTrigger>
              )}
              {supportedConfigs.includes("supervisor") && (
                <TabsTrigger value="supervisor">Supervisor Agents</TabsTrigger>
              )}
            </TabsList>

            <ScrollArea className="flex-1 overflow-y-auto">
              <TabsContent
                value="general"
                className="m-0 p-4"
              >
                <ConfigSection
                  title="Configuration"
                  action={
                    agentId &&
                    !loading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetConfig(agentId)}
                        className="h-8 px-2"
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Reset
                      </Button>
                    )
                  }
                >
                  {loading || !agentId ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Preset management and search */}
                      <div className="sticky top-0 z-10 mb-4 space-y-2 bg-white pb-2">
                        {/* Preset selector and save button */}
                        <div className="flex gap-2">
                          <Select
                            value=""
                            onValueChange={(presetName) => {
                              if (agentId && presetName) {
                                loadPreset(agentId, presetName);
                                toast.success(`Loaded preset: ${presetName}`);
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Load preset..." />
                            </SelectTrigger>
                            <SelectContent>
                              {agentId && getPresets(agentId).length === 0 && (
                                <div className="px-2 py-1.5 text-xs text-gray-500">
                                  No saved presets
                                </div>
                              )}
                              {agentId &&
                                getPresets(agentId).map((preset) => (
                                  <SelectItem
                                    key={preset.name}
                                    value={preset.name}
                                  >
                                    <div className="flex w-full items-center justify-between">
                                      <span>{preset.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-2 h-4 w-4 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (agentId) {
                                            deletePreset(agentId, preset.name);
                                            toast.success(
                                              `Deleted preset: ${preset.name}`,
                                            );
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowSavePresetDialog(true)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Search bar */}
                        <div className="relative">
                          <SearchIcon className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search configuration..."
                            value={configSearchTerm}
                            onChange={(e) =>
                              setConfigSearchTerm(e.target.value)
                            }
                            className="pl-8"
                          />
                        </div>
                      </div>

                      {/* Save preset dialog */}
                      <AlertDialog
                        open={showSavePresetDialog}
                        onOpenChange={setShowSavePresetDialog}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Save Configuration Preset
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Save the current configuration as a reusable
                              preset.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="preset-name">Preset Name</Label>
                              <Input
                                id="preset-name"
                                placeholder="e.g., Quick Research, Deep Analysis"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="preset-description">
                                Description (optional)
                              </Label>
                              <Textarea
                                id="preset-description"
                                placeholder="What is this preset optimized for?"
                                value={presetDescription}
                                onChange={(e) =>
                                  setPresetDescription(e.target.value)
                                }
                                className="min-h-[60px]"
                              />
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => {
                                setPresetName("");
                                setPresetDescription("");
                              }}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (agentId && presetName.trim()) {
                                  savePreset(
                                    agentId,
                                    presetName.trim(),
                                    presetDescription.trim() || undefined,
                                  );
                                  toast.success(`Saved preset: ${presetName}`);
                                  setPresetName("");
                                  setPresetDescription("");
                                }
                              }}
                              disabled={!presetName.trim()}
                            >
                              Save Preset
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {(() => {
                        // Filter configurations by search term
                        const filteredConfigs = configurations.filter(
                          (c) =>
                            c.label
                              .toLowerCase()
                              .includes(configSearchTerm.toLowerCase()) ||
                            c.description
                              ?.toLowerCase()
                              .includes(configSearchTerm.toLowerCase()),
                        );

                        // Group configurations
                        const grouped = _.groupBy(
                          filteredConfigs,
                          (c) => c.group || "Other Settings",
                        );
                        const sortedGroups = _.sortBy(
                          Object.entries(grouped),
                          ([_, fields]) => fields[0].group_order ?? 999,
                        );

                        return sortedGroups.map(([groupName, fields]) => (
                          <Collapsible
                            key={groupName}
                            defaultOpen={!fields[0].group_collapsed}
                            className="mb-4"
                          >
                            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded px-2 py-2 hover:bg-gray-50">
                              <h4 className="text-sm font-semibold text-gray-700">
                                {groupName}
                              </h4>
                              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-2">
                              {fields.map((c, index) => (
                                <ConfigField
                                  key={`${c.label}-${index}`}
                                  id={c.label}
                                  label={c.label}
                                  type={
                                    c.type === "boolean"
                                      ? "switch"
                                      : (c.type ?? "text")
                                  }
                                  description={c.description}
                                  placeholder={c.placeholder}
                                  options={c.options}
                                  min={c.min}
                                  max={c.max}
                                  step={c.step}
                                  agentId={agentId}
                                  icon={c.icon}
                                  visible_if={c.visible_if}
                                  default={c.default}
                                />
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ));
                      })()}
                    </>
                  )}
                </ConfigSection>
              </TabsContent>

              {supportedConfigs.includes("tools") && (
                <TabsContent
                  value="tools"
                  className="m-0 overflow-y-auto p-4"
                >
                  <ConfigSection title="Tool Configuration">
                    {/* Search across all tools */}
                    <Search
                      onSearchChange={debouncedSetSearchTerm}
                      placeholder="Search all tools..."
                    />

                    {agentId &&
                      toolConfigurations.length > 0 &&
                      (() => {
                        // Get all tool config fields
                        const graphToolConfig = toolConfigurations.find(
                          (tc) => tc.label === "mcp_config_graph",
                        );
                        const orchestratorToolConfig = toolConfigurations.find(
                          (tc) => tc.label === "orchestrator_mcp_tools",
                        );
                        const researchToolConfig = toolConfigurations.find(
                          (tc) => tc.label === "research_sub_agent_mcp_tools",
                        );
                        const critiqueToolConfig = toolConfigurations.find(
                          (tc) => tc.label === "critique_sub_agent_mcp_tools",
                        );

                        // Get enabled tools from each config
                        const graphEnabledTools =
                          graphToolConfig?.default?.tools || [];
                        const orchestratorEnabledTools =
                          orchestratorToolConfig?.default?.tools || [];
                        const researchEnabledTools =
                          researchToolConfig?.default?.tools || [];
                        const critiqueEnabledTools =
                          critiqueToolConfig?.default?.tools || [];

                        // Filter tools by search
                        const filteredTools = displayTools.filter(
                          (t) =>
                            !toolSearchTerm ||
                            t.name
                              .toLowerCase()
                              .includes(toolSearchTerm.toLowerCase()) ||
                            t.description
                              ?.toLowerCase()
                              .includes(toolSearchTerm.toLowerCase()),
                        );

                        // Group tools by MCP server name
                        const groupedTools = _.groupBy(
                          filteredTools,
                          (tool) => {
                            const parts = tool.name.split("__");
                            return parts.length > 1 ? parts[1] : "Other";
                          },
                        );

                        const totalEnabled =
                          graphEnabledTools.length +
                          orchestratorEnabledTools.length +
                          researchEnabledTools.length +
                          critiqueEnabledTools.length;

                        return (
                          <div className="space-y-6">
                            {/* Summary */}
                            <div className="space-y-1 rounded-md bg-gray-50 p-3 text-xs">
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  Tool Allocation:
                                </span>
                                <span className="font-semibold">
                                  {totalEnabled} total
                                </span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Graph-wide (all agents):</span>
                                <span>{graphEnabledTools.length}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Orchestrator:</span>
                                <span>+{orchestratorEnabledTools.length}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Research Sub-Agent:</span>
                                <span>+{researchEnabledTools.length}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Critique Sub-Agent:</span>
                                <span>+{critiqueEnabledTools.length}</span>
                              </div>
                            </div>

                            {/* Graph-wide tools section - Inherited by ALL agents */}
                            {graphToolConfig && (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-blue-600 uppercase">
                                    Graph-Wide Tools (All Agents Inherit)
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                  Tools available to orchestrator, research sub-agent, and critique sub-agent
                                </p>

                                {Object.entries(groupedTools).map(
                                  ([serverName, serverTools]) => {
                                    const graphTools = serverTools.filter((t) =>
                                      graphEnabledTools.includes(t.name),
                                    );

                                    if (
                                      graphTools.length === 0 &&
                                      toolSearchTerm
                                    )
                                      return null;

                                    return (
                                      <ToolGroupSection
                                        key={`graph-${serverName}`}
                                        groupName={`mcp__${serverName}`}
                                        tools={serverTools}
                                        agentId={agentId}
                                        toolId={graphToolConfig.label}
                                        source="graph"
                                        enabledTools={graphEnabledTools}
                                        onToggleAll={() => {
                                          const allEnabled = serverTools.every(
                                            (t) =>
                                              graphEnabledTools.includes(
                                                t.name,
                                              ),
                                          );
                                          const toolNames = serverTools.map(
                                            (t) => t.name,
                                          );

                                          const currentConfig =
                                            configsByAgentId[
                                              `${agentId}:selected-tools`
                                            ]?.[graphToolConfig.label] ||
                                            graphToolConfig.default;

                                          if (allEnabled) {
                                            // Remove all tools from this group
                                            const newTools = (
                                              currentConfig.tools || []
                                            ).filter(
                                              (t: string) =>
                                                !toolNames.includes(t),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              graphToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          } else {
                                            // Add all tools from this group
                                            const newTools = Array.from(
                                              new Set([
                                                ...(currentConfig.tools || []),
                                                ...toolNames,
                                              ]),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              graphToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          }
                                        }}
                                      />
                                    );
                                  },
                                )}
                              </>
                            )}

                            {/* Orchestrator Tools section */}
                            {orchestratorToolConfig && (
                              <>
                                <div className="mt-6 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-purple-600 uppercase">
                                    Orchestrator Tools (Additions)
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                  Additional tools ONLY for orchestrator (on top of graph-wide)
                                </p>

                                {Object.entries(groupedTools).map(
                                  ([serverName, serverTools]) => {
                                    const orchestratorTools = serverTools.filter((t) =>
                                      orchestratorEnabledTools.includes(t.name),
                                    );

                                    if (
                                      orchestratorTools.length === 0 &&
                                      toolSearchTerm
                                    )
                                      return null;

                                    return (
                                      <ToolGroupSection
                                        key={`orchestrator-${serverName}`}
                                        groupName={`mcp__${serverName}`}
                                        tools={serverTools}
                                        agentId={agentId}
                                        toolId={orchestratorToolConfig.label}
                                        source="agent"
                                        enabledTools={orchestratorEnabledTools}
                                        onToggleAll={() => {
                                          const allEnabled = serverTools.every(
                                            (t) =>
                                              orchestratorEnabledTools.includes(
                                                t.name,
                                              ),
                                          );
                                          const toolNames = serverTools.map(
                                            (t) => t.name,
                                          );

                                          const currentConfig =
                                            configsByAgentId[
                                              `${agentId}:selected-tools`
                                            ]?.[orchestratorToolConfig.label] ||
                                            orchestratorToolConfig.default;

                                          if (allEnabled) {
                                            const newTools = (
                                              currentConfig.tools || []
                                            ).filter(
                                              (t: string) =>
                                                !toolNames.includes(t),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              orchestratorToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          } else {
                                            const newTools = Array.from(
                                              new Set([
                                                ...(currentConfig.tools || []),
                                                ...toolNames,
                                              ]),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              orchestratorToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          }
                                        }}
                                      />
                                    );
                                  },
                                )}
                              </>
                            )}

                            {/* Research Sub-Agent Tools section */}
                            {researchToolConfig && (
                              <>
                                <div className="mt-6 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-green-600 uppercase">
                                    Research Sub-Agent Tools (Additions)
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                  Additional tools ONLY for research sub-agent (on top of graph-wide)
                                </p>

                                {Object.entries(groupedTools).map(
                                  ([serverName, serverTools]) => {
                                    const researchTools = serverTools.filter((t) =>
                                      researchEnabledTools.includes(t.name),
                                    );

                                    if (
                                      researchTools.length === 0 &&
                                      toolSearchTerm
                                    )
                                      return null;

                                    return (
                                      <ToolGroupSection
                                        key={`research-${serverName}`}
                                        groupName={`mcp__${serverName}`}
                                        tools={serverTools}
                                        agentId={agentId}
                                        toolId={researchToolConfig.label}
                                        source="agent"
                                        enabledTools={researchEnabledTools}
                                        onToggleAll={() => {
                                          const allEnabled = serverTools.every(
                                            (t) =>
                                              researchEnabledTools.includes(
                                                t.name,
                                              ),
                                          );
                                          const toolNames = serverTools.map(
                                            (t) => t.name,
                                          );

                                          const currentConfig =
                                            configsByAgentId[
                                              `${agentId}:selected-tools`
                                            ]?.[researchToolConfig.label] ||
                                            researchToolConfig.default;

                                          if (allEnabled) {
                                            const newTools = (
                                              currentConfig.tools || []
                                            ).filter(
                                              (t: string) =>
                                                !toolNames.includes(t),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              researchToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          } else {
                                            const newTools = Array.from(
                                              new Set([
                                                ...(currentConfig.tools || []),
                                                ...toolNames,
                                              ]),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              researchToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          }
                                        }}
                                      />
                                    );
                                  },
                                )}
                              </>
                            )}

                            {/* Critique Sub-Agent Tools section */}
                            {critiqueToolConfig && (
                              <>
                                <div className="mt-6 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-orange-600 uppercase">
                                    Critique Sub-Agent Tools (Additions)
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                  Additional tools ONLY for critique sub-agent (on top of graph-wide)
                                </p>

                                {Object.entries(groupedTools).map(
                                  ([serverName, serverTools]) => {
                                    const critiqueTools = serverTools.filter((t) =>
                                      critiqueEnabledTools.includes(t.name),
                                    );

                                    if (
                                      critiqueTools.length === 0 &&
                                      toolSearchTerm
                                    )
                                      return null;

                                    return (
                                      <ToolGroupSection
                                        key={`critique-${serverName}`}
                                        groupName={`mcp__${serverName}`}
                                        tools={serverTools}
                                        agentId={agentId}
                                        toolId={critiqueToolConfig.label}
                                        source="agent"
                                        enabledTools={critiqueEnabledTools}
                                        onToggleAll={() => {
                                          const allEnabled = serverTools.every(
                                            (t) =>
                                              critiqueEnabledTools.includes(
                                                t.name,
                                              ),
                                          );
                                          const toolNames = serverTools.map(
                                            (t) => t.name,
                                          );

                                          const currentConfig =
                                            configsByAgentId[
                                              `${agentId}:selected-tools`
                                            ]?.[critiqueToolConfig.label] ||
                                            critiqueToolConfig.default;

                                          if (allEnabled) {
                                            const newTools = (
                                              currentConfig.tools || []
                                            ).filter(
                                              (t: string) =>
                                                !toolNames.includes(t),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              critiqueToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          } else {
                                            const newTools = Array.from(
                                              new Set([
                                                ...(currentConfig.tools || []),
                                                ...toolNames,
                                              ]),
                                            );
                                            updateConfig(
                                              `${agentId}:selected-tools`,
                                              critiqueToolConfig.label,
                                              {
                                                ...currentConfig,
                                                tools: newTools,
                                              },
                                            );
                                          }
                                        }}
                                      />
                                    );
                                  },
                                )}
                              </>
                            )}

                            {/* Tool Exclusions - Exclude graph-wide tools from this agent */}
                            {graphToolConfig &&
                              graphEnabledTools.length > 0 &&
                              (() => {
                                // Get current exclusions from config
                                const exclusionsConfig = configurations.find(
                                  (c) => c.label === "mcp_config_exclusions",
                                );
                                const currentExclusions = (exclusionsConfig?.default || []) as string[];

                                return (
                                  <>
                                    <div className="mt-6 flex items-center gap-2">
                                      <div className="h-px flex-1 bg-gray-200" />
                                      <span className="text-xs font-semibold text-gray-500 uppercase">
                                        Exclude from This Agent
                                      </span>
                                      <div className="h-px flex-1 bg-gray-200" />
                                    </div>

                                    <div className="rounded-md border border-red-100 bg-red-50/30 p-3">
                                      <p className="mb-3 text-xs text-gray-600">
                                        Remove specific graph-wide tools from
                                        this agent only. Other agents will still
                                        have access.
                                      </p>

                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                          >
                                            {currentExclusions.length > 0
                                              ? `${currentExclusions.length} tools excluded`
                                              : "Select tools to exclude..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-full p-0"
                                          align="start"
                                        >
                                          <Command className="w-full">
                                            <CommandInput placeholder="Search graph-wide tools..." />
                                            <CommandList>
                                              <CommandEmpty>
                                                No graph-wide tools found.
                                              </CommandEmpty>
                                              <CommandGroup>
                                                {graphEnabledTools.map(
                                                  (toolName) => {
                                                    const isExcluded =
                                                      currentExclusions.includes(
                                                        toolName,
                                                      );
                                                    return (
                                                      <CommandItem
                                                        key={toolName}
                                                        value={toolName}
                                                        onSelect={() => {
                                                          const newExclusions =
                                                            isExcluded
                                                              ? currentExclusions.filter(
                                                                  (t: string) =>
                                                                    t !==
                                                                    toolName,
                                                                )
                                                              : [
                                                                  ...currentExclusions,
                                                                  toolName,
                                                                ];

                                                          updateConfig(
                                                            agentId,
                                                            "mcp_config_exclusions",
                                                            newExclusions,
                                                          );
                                                        }}
                                                        className="flex items-center justify-between"
                                                      >
                                                        <Check
                                                          className={cn(
                                                            "ml-auto h-4 w-4",
                                                            isExcluded
                                                              ? "opacity-100"
                                                              : "opacity-0",
                                                          )}
                                                        />
                                                        <p className="flex-1 truncate pr-2">
                                                          {toolName}
                                                        </p>
                                                      </CommandItem>
                                                    );
                                                  },
                                                )}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>

                                      {currentExclusions.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                          <p className="text-xs font-medium text-gray-700">
                                            Excluded:
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {currentExclusions.map(
                                              (toolName: string) => (
                                                <Badge
                                                  key={toolName}
                                                  variant="secondary"
                                                  className="bg-red-50 text-xs text-red-700"
                                                >
                                                  {toolName.split("__").pop()}
                                                  <button
                                                    onClick={() => {
                                                      const newExclusions =
                                                        currentExclusions.filter(
                                                          (t: string) =>
                                                            t !== toolName,
                                                        );
                                                      updateConfig(
                                                        agentId,
                                                        "mcp_config_exclusions",
                                                        newExclusions,
                                                      );
                                                    }}
                                                    className="ml-1 hover:text-red-900"
                                                  >
                                                    ×
                                                  </button>
                                                </Badge>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}

                            {/* Load more button */}
                            {cursor && !toolSearchTerm && (
                              <div className="flex justify-center py-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      setLoadingMore(true);
                                      const moreTool = await getTools(cursor);
                                      setTools((prevTools) => [
                                        ...prevTools,
                                        ...moreTool,
                                      ]);
                                    } catch (error) {
                                      console.error(
                                        "Failed to load more tools:",
                                        error,
                                      );
                                    } finally {
                                      setLoadingMore(false);
                                    }
                                  }}
                                  disabled={loadingMore || loading}
                                >
                                  {loadingMore
                                    ? "Loading..."
                                    : "Load More Tools"}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </ConfigSection>
                </TabsContent>
              )}

              {supportedConfigs.includes("rag") && (
                <TabsContent
                  value="rag"
                  className="m-0 overflow-y-auto p-4"
                >
                  <ConfigSection title="RAG Configuration">
                    {agentId &&
                      ragConfigurations.length > 0 &&
                      (() => {
                        // Get all RAG config fields
                        const graphRagConfig = ragConfigurations.find(
                          (rc) => rc.label === "rag_graph",
                        );
                        const orchestratorRagConfig = ragConfigurations.find(
                          (rc) => rc.label === "orchestrator_rag_collections",
                        );
                        const researchRagConfig = ragConfigurations.find(
                          (rc) => rc.label === "research_sub_agent_rag_collections",
                        );
                        const critiqueRagConfig = ragConfigurations.find(
                          (rc) => rc.label === "critique_sub_agent_rag_collections",
                        );

                        const graphCollections =
                          graphRagConfig?.default?.collections || [];
                        const orchestratorCollections =
                          orchestratorRagConfig?.default?.collections || [];
                        const researchCollections =
                          researchRagConfig?.default?.collections || [];
                        const critiqueCollections =
                          critiqueRagConfig?.default?.collections || [];
                        const totalCollections =
                          graphCollections.length +
                          orchestratorCollections.length +
                          researchCollections.length +
                          critiqueCollections.length;

                        return (
                          <div className="space-y-6">
                            {/* Summary */}
                            <div className="space-y-1 rounded-md bg-gray-50 p-3 text-xs">
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  Collection Allocation:
                                </span>
                                <span className="font-semibold">
                                  {totalCollections} total
                                </span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Graph-wide (all agents):</span>
                                <span>{graphCollections.length}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Orchestrator:</span>
                                <span>+{orchestratorCollections.length}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Research Sub-Agent:</span>
                                <span>+{researchCollections.length}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>• Critique Sub-Agent:</span>
                                <span>+{critiqueCollections.length}</span>
                              </div>
                            </div>

                            {/* Graph-wide RAG */}
                            {graphRagConfig && (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-gray-500 uppercase">
                                    Graph-Wide Collections
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <div className="rounded-md border border-blue-100 bg-blue-50/30 p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-50 text-xs text-blue-700"
                                    >
                                      Inherited by All Agents
                                    </Badge>
                                  </div>
                                  <ConfigFieldRAG
                                    id={graphRagConfig.label}
                                    label={graphRagConfig.label}
                                    agentId={agentId}
                                  />
                                </div>
                              </>
                            )}

                            {/* Orchestrator RAG Collections */}
                            {orchestratorRagConfig && (
                              <>
                                <div className="mt-6 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-purple-600 uppercase">
                                    Orchestrator Collections (Additions)
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <div className="rounded-md border border-purple-100 bg-purple-50/30 p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="bg-purple-50 text-xs text-purple-700"
                                    >
                                      Orchestrator Only
                                    </Badge>
                                  </div>
                                  <ConfigFieldRAG
                                    id={orchestratorRagConfig.label}
                                    label={orchestratorRagConfig.label}
                                    agentId={agentId}
                                  />
                                </div>
                              </>
                            )}

                            {/* Research Sub-Agent RAG Collections */}
                            {researchRagConfig && (
                              <>
                                <div className="mt-6 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-green-600 uppercase">
                                    Research Sub-Agent Collections (Additions)
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <div className="rounded-md border border-green-100 bg-green-50/30 p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-50 text-xs text-green-700"
                                    >
                                      Research Only
                                    </Badge>
                                  </div>
                                  <ConfigFieldRAG
                                    id={researchRagConfig.label}
                                    label={researchRagConfig.label}
                                    agentId={agentId}
                                  />
                                </div>
                              </>
                            )}

                            {/* Critique Sub-Agent RAG Collections */}
                            {critiqueRagConfig && (
                              <>
                                <div className="mt-6 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-gray-200" />
                                  <span className="text-xs font-semibold text-orange-600 uppercase">
                                    Critique Sub-Agent Collections (Additions)
                                  </span>
                                  <div className="h-px flex-1 bg-gray-200" />
                                </div>
                                <div className="rounded-md border border-orange-100 bg-orange-50/30 p-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="bg-orange-50 text-xs text-orange-700"
                                    >
                                      Critique Only
                                    </Badge>
                                  </div>
                                  <ConfigFieldRAG
                                    id={critiqueRagConfig.label}
                                    label={critiqueRagConfig.label}
                                    agentId={agentId}
                                  />
                                </div>
                              </>
                            )}

                            {/* RAG Collection Exclusions */}
                            {graphRagConfig &&
                              graphCollections.length > 0 &&
                              (() => {
                                const exclusionsConfig = configurations.find(
                                  (c) => c.label === "rag_exclusions",
                                );
                                const currentExclusions = (exclusionsConfig?.default || []) as string[];

                                return (
                                  <>
                                    <div className="mt-6 flex items-center gap-2">
                                      <div className="h-px flex-1 bg-gray-200" />
                                      <span className="text-xs font-semibold text-gray-500 uppercase">
                                        Exclude Collections
                                      </span>
                                      <div className="h-px flex-1 bg-gray-200" />
                                    </div>

                                    <div className="rounded-md border border-red-100 bg-red-50/30 p-3">
                                      <p className="mb-3 text-xs text-gray-600">
                                        Remove specific graph-wide collections
                                        from this agent only.
                                      </p>

                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                          >
                                            {currentExclusions.length > 0
                                              ? `${currentExclusions.length} collections excluded`
                                              : "Select collections to exclude..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-full p-0"
                                          align="start"
                                        >
                                          <Command className="w-full">
                                            <CommandInput placeholder="Search graph-wide collections..." />
                                            <CommandList>
                                              <CommandEmpty>
                                                No graph-wide collections.
                                              </CommandEmpty>
                                              <CommandGroup>
                                                {graphCollections.map(
                                                  (collectionId) => {
                                                    const isExcluded =
                                                      currentExclusions.includes(
                                                        collectionId,
                                                      );
                                                    return (
                                                      <CommandItem
                                                        key={collectionId}
                                                        value={collectionId}
                                                        onSelect={() => {
                                                          const newExclusions =
                                                            isExcluded
                                                              ? currentExclusions.filter(
                                                                  (c: string) =>
                                                                    c !==
                                                                    collectionId,
                                                                )
                                                              : [
                                                                  ...currentExclusions,
                                                                  collectionId,
                                                                ];

                                                          updateConfig(
                                                            agentId,
                                                            "rag_exclusions",
                                                            newExclusions,
                                                          );
                                                        }}
                                                        className="flex items-center justify-between"
                                                      >
                                                        <Check
                                                          className={cn(
                                                            "ml-auto h-4 w-4",
                                                            isExcluded
                                                              ? "opacity-100"
                                                              : "opacity-0",
                                                          )}
                                                        />
                                                        <p className="flex-1 truncate pr-2">
                                                          {collectionId}
                                                        </p>
                                                      </CommandItem>
                                                    );
                                                  },
                                                )}
                                              </CommandGroup>
                                            </CommandList>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>

                                      {currentExclusions.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                          <p className="text-xs font-medium text-gray-700">
                                            Excluded:
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {currentExclusions.map(
                                              (collectionId: string) => (
                                                <Badge
                                                  key={collectionId}
                                                  variant="secondary"
                                                  className="bg-red-50 text-xs text-red-700"
                                                >
                                                  {collectionId}
                                                  <button
                                                    onClick={() => {
                                                      const newExclusions =
                                                        currentExclusions.filter(
                                                          (c: string) =>
                                                            c !== collectionId,
                                                        );
                                                      updateConfig(
                                                        agentId,
                                                        "rag_exclusions",
                                                        newExclusions,
                                                      );
                                                    }}
                                                    className="ml-1 hover:text-red-900"
                                                  >
                                                    ×
                                                  </button>
                                                </Badge>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                          </div>
                        );
                      })()}
                  </ConfigSection>
                </TabsContent>
              )}

              {supportedConfigs.includes("supervisor") && (
                <TabsContent
                  value="supervisor"
                  className="m-0 overflow-y-auto p-4"
                >
                  <ConfigSection title="Supervisor Agents">
                    {agentId && (
                      <ConfigFieldAgents
                        id={agentsConfigurations[0].label}
                        label={agentsConfigurations[0].label}
                        agentId={agentId}
                      />
                    )}
                  </ConfigSection>
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>
        </div>
      )}
      <NameAndDescriptionAlertDialog
        name={newName}
        setName={setNewName}
        description={newDescription}
        setDescription={setNewDescription}
        open={openNameAndDescriptionAlertDialog}
        setOpen={setOpenNameAndDescriptionAlertDialog}
        handleSave={handleSave}
      />
    </div>
  );
});

ConfigurationSidebar.displayName = "ConfigurationSidebar";
