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
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  configurations: ConfigurableFieldUIMetadata[];
  toolConfigurations: ConfigurableFieldMCPMetadata[];
  config: Record<string, any>;
  setConfig: (config: Record<string, any>) => void;
  agentId: string;
  ragConfigurations: ConfigurableFieldRAGMetadata[];
  agentsConfigurations: ConfigurableFieldAgentsMetadata[];
}

export function AgentFieldsForm({
  name,
  setName,
  description,
  setDescription,
  configurations,
  toolConfigurations,
  config,
  setConfig,
  agentId,
  ragConfigurations,
  agentsConfigurations,
}: AgentFieldsFormProps) {
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

  return (
    <div className="flex flex-col gap-8 overflow-y-auto py-4">
      <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
        <p className="text-lg font-semibold tracking-tight">Agent Details</p>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="oap_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Emails Agent"
          />
        </div>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="oap_description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agent that handles emails"
          />
        </div>
      </div>
      {configurations.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
            <p className="text-lg font-semibold tracking-tight">
              Agent Configuration
            </p>
            {configurations.map((c, index) => (
              <ConfigField
                key={`${c.label}-${index}`}
                className="w-full"
                id={c.label}
                label={c.label}
                type={c.type === "boolean" ? "switch" : (c.type ?? "text")}
                description={c.description}
                placeholder={c.placeholder}
                options={c.options}
                min={c.min}
                max={c.max}
                step={c.step}
                value={config[c.label]}
                setValue={(v) => setConfig({ ...config, [c.label]: v })}
                agentId={agentId}
              />
            ))}
          </div>
        </>
      )}
      {toolConfigurations.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
            <p className="text-lg font-semibold tracking-tight">Agent Tools</p>
            <Search
              onSearchChange={debouncedSetSearchTerm}
              placeholder="Search tools..."
              className="w-full"
            />
            <div className="max-h-[500px] w-full flex-1 overflow-y-auto rounded-md border-[1px] border-slate-200 px-4">
              {toolConfigurations[0]?.label
                ? displayTools.map((c) => (
                    <ConfigFieldTool
                      key={`tool-${c.name}`}
                      id={c.name}
                      label={c.name}
                      description={c.description}
                      agentId={agentId}
                      toolId={toolConfigurations[0].label}
                      className="border-b-[1px] py-4"
                      value={config[toolConfigurations[0].label]}
                      setValue={(v) =>
                        setConfig({
                          ...config,
                          [toolConfigurations[0].label]: v,
                        })
                      }
                    />
                  ))
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
                        setTools((prevTools) => [...prevTools, ...moreTool]);
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
        </>
      )}
      {ragConfigurations.length > 0 && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-lg font-semibold tracking-tight">Agent RAG</p>
            <ConfigFieldRAG
              id={ragConfigurations[0].label}
              label={ragConfigurations[0].label}
              agentId={agentId}
              // TODO: Start supporting externally managed field.
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
            <ConfigFieldAgents
              id={agentsConfigurations[0].label}
              label={agentsConfigurations[0].label}
              agentId={agentId}
              value={config[agentsConfigurations[0].label]}
              setValue={(v) =>
                setConfig({
                  ...config,
                  [agentsConfigurations[0].label]: v,
                })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
