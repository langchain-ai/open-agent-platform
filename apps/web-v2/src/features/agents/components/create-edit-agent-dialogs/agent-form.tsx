"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "@/components/ui/tool-search";
import { Button } from "@/components/ui/button";
import {
  ConfigField,
  ConfigFieldSubAgents,
  ConfigFieldTool,
  ConfigFieldTriggers,
} from "@/components/config-fields";
import { useSearchTools } from "@/hooks/use-search-tools";
import { useMCPContext } from "@/providers/MCP";
import { useFetchPreselectedTools } from "@/hooks/use-fetch-preselected-tools";
import { Controller, useFormContext } from "react-hook-form";
import { AgentFormValues } from "./types";
import { useFlags } from "launchdarkly-react-client-sdk";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";

interface AgentFieldsFormProps {
  agentId: string;
}

export function AgentFieldsForm({ agentId }: AgentFieldsFormProps) {
  const form = useFormContext<AgentFormValues>();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();

  const { tools, setTools, getTools, cursor, loading } = useMCPContext();
  const { toolSearchTerm, debouncedSetSearchTerm, displayTools } =
    useSearchTools(tools, {
      preSelectedTools: [],
    });

  const { loadingMore, setLoadingMore } = useFetchPreselectedTools({
    tools,
    setTools,
    getTools,
    cursor,
    // TODO: Update to properly pass preselected tools.
    preselectedTools: [],
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

      <Separator />
      <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
        <p className="text-lg font-semibold tracking-tight">
          Agent Configuration
        </p>
        <Controller
          control={form.control}
          name="config.instructions"
          render={({ field: { value, onChange } }) => (
            <ConfigField
              className="w-full"
              id="instructions"
              label="Instructions"
              type="textarea"
              description="Instructions for the agent"
              placeholder="Instructions for the agent"
              value={value}
              setValue={onChange}
            />
          )}
        />
      </div>
      <Separator />
      <div className="flex w-full flex-col items-start justify-start gap-4">
        <p className="text-lg font-semibold tracking-tight">Agent Tools</p>
        <Search
          onSearchChange={debouncedSetSearchTerm}
          placeholder="Search tools..."
          className="w-full"
        />
        <div className="max-h-[500px] w-full overflow-y-auto rounded-md border-[1px] border-slate-200 px-4">
          {displayTools.map((c) => (
            <Controller
              key={`tool-${c.name}`}
              control={form.control}
              name="config.tools"
              render={({ field: { value, onChange } }) => (
                <ConfigFieldTool
                  key={`tool-field-${c.name}`}
                  id={c.name}
                  label={c.name}
                  description={c.description}
                  className="border-b-[1px] py-4"
                  value={value}
                  setValue={onChange}
                />
              )}
            />
          ))}
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
      <Separator />
      <div className="flex w-full flex-col items-start justify-start gap-2">
        <p className="text-lg font-semibold tracking-tight">Sub Agents</p>
        <Controller
          control={form.control}
          name="config.subagents"
          render={({ field: { value, onChange } }) => (
            <ConfigFieldSubAgents
              value={value}
              setValue={onChange}
              availableTools={tools}
              toolsLoading={loading}
              displayTools={displayTools}
              toolSearchTerm={toolSearchTerm}
              debouncedSetSearchTerm={debouncedSetSearchTerm}
              loadingMore={loadingMore}
              hasMore={!!cursor}
              selectedMainTools={form.watch("config.tools")?.tools || []}
              onLoadMore={() => {
                if (!loadingMore && cursor) {
                  setLoadingMore(true);
                  getTools(cursor)
                    .then((newTools) => {
                      setTools((prev) => [...prev, ...newTools]);
                      setLoadingMore(false);
                    })
                    .catch(() => {
                      setLoadingMore(false);
                    });
                }
              }}
            />
          )}
        />
      </div>
      {showTriggersTab !== false && (
        <>
          <Separator />
          <div className="flex w-full flex-col items-start justify-start gap-2">
            <p className="text-lg font-semibold tracking-tight">
              Agent Triggers
            </p>
            <Controller
              control={form.control}
              name="config.triggers"
              render={({ field: { value, onChange } }) => (
                <ConfigFieldTriggers
                  value={value}
                  setValue={onChange}
                />
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
