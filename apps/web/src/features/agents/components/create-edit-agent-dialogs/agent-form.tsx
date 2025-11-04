import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "@/components/ui/tool-search";
import { Button } from "@/components/ui/button";
import {
  ConfigField,
  ConfigFieldAgents,
  ConfigFieldRAG,
  ConfigFieldTool,
} from "@/features/chat/components/configuration-sidebar/config-field";
import { useSearchTools } from "@/hooks/use-search-tools";
import { useMCPContext } from "@/providers/MCP";
import {
  ConfigurableFieldAgentsMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldUIMetadata,
} from "@/types/configurable";
import _ from "lodash";
import { useFetchPreselectedTools } from "@/hooks/use-fetch-preselected-tools";
import { Controller, useFormContext } from "react-hook-form";
import { PromptTemplateSelector } from "../prompt-template-selector";
import { SystemPromptPreviewDialog } from "../system-prompt-preview-dialog";
import { SystemPromptEditorDialog } from "../system-prompt-editor-dialog";
import { usePromptModes } from "@/hooks/use-prompt-modes";
import { useState, useEffect, useMemo } from "react";
import { Sparkles } from "lucide-react";

export function AgentFieldsFormLoading() {
  return (
    <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`loading-${index}`}
          className="flex w-full flex-col items-start justify-start gap-2"
        >
          <Skeleton className="h-10 w-[85%]" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

interface AgentFieldsFormProps {
  configurations: ConfigurableFieldUIMetadata[];
  toolConfigurations: ConfigurableFieldMCPMetadata[];
  agentId: string;
  ragConfigurations: ConfigurableFieldRAGMetadata[];
  agentsConfigurations: ConfigurableFieldAgentsMetadata[];
}

export function AgentFieldsForm({
  configurations,
  toolConfigurations,
  agentId,
  ragConfigurations,
  agentsConfigurations,
}: AgentFieldsFormProps) {
  const form = useFormContext<{
    name: string;
    description: string;
    config: Record<string, any>;
  }>();

  // Watch the selected model to conditionally show Claude Sonnet 4.5 features
  const selectedModel = form.watch("config.model_name");
  const isClaudeSonnet45 =
    selectedModel?.toLowerCase().includes("claude-sonnet-4-5-20250929") ||
    selectedModel
      ?.toLowerCase()
      .includes("anthropic:claude-sonnet-4-5-20250929");

  // List of Claude Sonnet 4.5 specific configuration field labels
  const claudeSonnet45Fields = [
    "enable_1m_context",
    "enable_extended_thinking",
    "thinking_budget_tokens",
    "enable_prompt_caching",
    "cache_ttl",
    "enable_context_management",
    "enable_interleaved_thinking",
  ];

  const { tools, setTools, getTools, cursor, loading } = useMCPContext();
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

  // Prompt modes state management
  const promptModes = usePromptModes(agentId);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Get currently selected tools from form state
  const selectedTools = useMemo(() => {
    const toolsVal =
      form.watch(`config.${toolConfigurations[0]?.label}`)?.tools || [];
    return Array.isArray(toolsVal) ? toolsVal : [];
  }, [form, toolConfigurations]);

  // Count how many tools have modes selected
  const modesSelectedCount = Object.keys(promptModes.promptModes).length;

  // Clean up modes when tools are disabled
  useEffect(() => {
    // Remove modes for tools that are no longer selected
    const currentModes = promptModes.promptModes;
    Object.keys(currentModes).forEach((toolName) => {
      if (!selectedTools.includes(toolName)) {
        promptModes.removeToolPromptMode(toolName);
      }
    });
  }, [selectedTools, promptModes]);

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
        <p className="text-lg font-semibold tracking-tight">Agent Details</p>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="oap_name"
            {...form.register("name")}
            placeholder="Emails Agent"
          />
        </div>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="oap_description"
            {...form.register("description")}
            placeholder="Agent that handles emails"
          />
        </div>
      </div>

      <>
        {configurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
              <p className="text-lg font-semibold tracking-tight">
                Agent Configuration
              </p>
              {configurations
                .filter((c) => {
                  // Filter out Claude Sonnet 4.5 specific fields if that model is not selected
                  if (claudeSonnet45Fields.includes(c.label)) {
                    return false; // Will render separately below
                  }
                  return true;
                })
                .map((c, index) => (
                  <Controller
                    key={`${c.label}-${index}`}
                    control={form.control}
                    name={`config.${c.label}`}
                    render={({ field: { value, onChange } }) => (
                      <ConfigField
                        className="w-full"
                        id={c.label}
                        label={c.label}
                        type={
                          c.type === "boolean" ? "switch" : (c.type ?? "text")
                        }
                        description={c.description}
                        placeholder={c.placeholder}
                        options={c.options}
                        min={c.min}
                        max={c.max}
                        step={c.step}
                        value={value}
                        setValue={onChange}
                        agentId={agentId}
                        icon={c.icon}
                        visible_if={c.visible_if}
                        default={c.default}
                      />
                    )}
                  />
                ))}
            </div>
          </>
        )}
        {/* Claude Sonnet 4.5 Advanced Features - Only shown when that model is selected */}
        {isClaudeSonnet45 && configurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
              <div className="flex flex-col gap-1">
                <p className="text-lg font-semibold tracking-tight">
                  Claude Sonnet 4.5 Advanced Features
                </p>
                <p className="text-muted-foreground text-sm">
                  Configure Claude Sonnet 4.5 specific capabilities like
                  extended thinking, prompt caching, and context management.
                </p>
              </div>
              {configurations
                .filter((c) => claudeSonnet45Fields.includes(c.label))
                .map((c, index) => (
                  <Controller
                    key={`${c.label}-${index}`}
                    control={form.control}
                    name={`config.${c.label}`}
                    render={({ field: { value, onChange } }) => (
                      <ConfigField
                        className="w-full"
                        id={c.label}
                        label={c.label}
                        type={
                          c.type === "boolean" ? "switch" : (c.type ?? "text")
                        }
                        description={c.description}
                        placeholder={c.placeholder}
                        options={c.options}
                        min={c.min}
                        max={c.max}
                        step={c.step}
                        value={value}
                        setValue={onChange}
                        agentId={agentId}
                        icon={c.icon}
                        visible_if={c.visible_if}
                        default={c.default}
                      />
                    )}
                  />
                ))}
            </div>
          </>
        )}
        {toolConfigurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-4">
              <div className="flex w-full items-center justify-between">
                <p className="text-lg font-semibold tracking-tight">
                  Agent Tools
                </p>
                <div className="flex gap-2">
                  {modesSelectedCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      type="button"
                    >
                      <Sparkles className="size-4" />
                      Preview System Prompt ({modesSelectedCount}{" "}
                      {modesSelectedCount === 1 ? "mode" : "modes"})
                    </Button>
                  )}
                </div>
              </div>
              <Search
                onSearchChange={debouncedSetSearchTerm}
                placeholder="Search tools..."
                className="w-full"
              />
              <div className="relative w-full flex-1 basis-[500px] rounded-md border-[1px] border-slate-200 px-4">
                <div className="absolute inset-0 overflow-y-auto px-4">
                  {toolConfigurations[0]?.label
                    ? displayTools.map((c) => {
                        const toolIsEnabled = selectedTools.includes(c.name);
                        return (
                          <div
                            key={`tool-wrapper-${c.name}`}
                            className="border-b-[1px] py-4"
                          >
                            <Controller
                              key={`tool-${c.name}`}
                              control={form.control}
                              name={`config.${toolConfigurations[0].label}`}
                              render={({ field: { value, onChange } }) => (
                                <ConfigFieldTool
                                  id={c.name}
                                  label={c.name}
                                  description={c.description}
                                  agentId={agentId}
                                  toolId={toolConfigurations[0].label}
                                  className=""
                                  value={value}
                                  setValue={onChange}
                                />
                              )}
                            />
                            {toolIsEnabled && c.metadata?.agent_prompts && (
                              <PromptTemplateSelector
                                tool={c}
                                selectedMode={promptModes.promptModes[c.name]}
                                onSelectMode={(templateKey) =>
                                  promptModes.setToolPromptMode(
                                    c.name,
                                    templateKey,
                                  )
                                }
                              />
                            )}
                          </div>
                        );
                      })
                    : null}
                  {displayTools.length === 0 && toolSearchTerm && (
                    <p className="my-4 w-full text-center text-sm text-slate-500">
                      No tools found matching "{toolSearchTerm}".
                    </p>
                  )}
                  {tools.length === 0 && !toolSearchTerm && (
                    <p className="my-4 w-full text-center text-sm text-slate-500">
                      No tools available for this agent.
                    </p>
                  )}
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
                            console.error("Failed to load more tools:", error);
                          } finally {
                            setLoadingMore(false);
                          }
                        }}
                        disabled={loadingMore || loading}
                      >
                        {loadingMore ? "Loading..." : "Load More Tools"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        {ragConfigurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-2">
              <p className="text-lg font-semibold tracking-tight">Agent RAG</p>
              <Controller
                control={form.control}
                name={`config.${ragConfigurations[0].label}`}
                render={({ field: { value, onChange } }) => (
                  <ConfigFieldRAG
                    id={ragConfigurations[0].label}
                    label={ragConfigurations[0].label}
                    agentId={agentId}
                    value={value}
                    setValue={onChange}
                  />
                )}
              />
            </div>
          </>
        )}
        {agentsConfigurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-2">
              <p className="text-lg font-semibold tracking-tight">
                Supervisor Agents
              </p>
              <Controller
                control={form.control}
                name={`config.${agentsConfigurations[0].label}`}
                render={({ field: { value, onChange } }) => (
                  <ConfigFieldAgents
                    id={agentsConfigurations[0].label}
                    label={agentsConfigurations[0].label}
                    agentId={agentId}
                    value={value}
                    setValue={onChange}
                  />
                )}
              />
            </div>
          </>
        )}
      </>

      {/* System Prompt Preview Dialog */}
      <SystemPromptPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        tools={tools}
        selectedToolNames={selectedTools}
        toolPromptModes={promptModes.promptModes}
        onEditPrompt={(compiledPrompt) => {
          promptModes.setCustomPrompt(compiledPrompt);
          setShowPreview(false);
          setShowEditor(true);
        }}
        onAcceptPrompt={(compiledPrompt) => {
          promptModes.setCustomPrompt(compiledPrompt);
          promptModes.setUseCompiled(true);
        }}
      />

      {/* System Prompt Editor Dialog */}
      <SystemPromptEditorDialog
        open={showEditor}
        onClose={() => setShowEditor(false)}
        initialPrompt={promptModes.customPrompt || ""}
        onSave={(editedPrompt) => {
          promptModes.setCustomPrompt(editedPrompt);
          promptModes.setUseCompiled(false);
        }}
        onReset={() => {
          promptModes.setUseCompiled(true);
        }}
      />
    </div>
  );
}
