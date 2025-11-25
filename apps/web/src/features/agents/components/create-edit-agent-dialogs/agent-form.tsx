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
import { ToolSelectionByServer } from "./tool-selection-by-server";

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

  const { tools, toolsByServer, setTools, getTools, getToolsByServer, cursor, loading } =
    useMCPContext();
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
              {configurations.map((c, index) => (
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
              <p className="text-lg font-semibold tracking-tight">
                Agent Tools
              </p>
              <Search
                onSearchChange={debouncedSetSearchTerm}
                placeholder="Search tools..."
                className="w-full"
              />
              <div className="relative w-full flex-1 basis-[500px] rounded-md border-[1px] border-slate-200 px-4">
                <div className="absolute inset-0 overflow-y-auto px-4">
                  {toolConfigurations[0]?.label && (
                    <Controller
                      control={form.control}
                      name={`config.${toolConfigurations[0].label}`}
                      render={({ field: { value, onChange } }) => (
                        <ToolSelectionByServer
                          toolsByServer={toolsByServer}
                          selectedTools={value?.tools || []}
                          onToolToggle={(toolName) => {
                            const currentTools = value?.tools || [];
                            const newTools = currentTools.includes(toolName)
                              ? currentTools.filter(
                                  (t: string) => t !== toolName,
                                )
                              : [...currentTools, toolName];
                            onChange({ ...value, tools: newTools });
                          }}
                        />
                      )}
                    />
                  )}
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
                            const moreTool = await getToolsByServer(cursor, cursor);
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
    </div>
  );
}
