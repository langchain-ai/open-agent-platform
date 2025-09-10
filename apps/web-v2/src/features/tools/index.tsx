"use client";

import React from "react";
import { Wrench, ChevronRightIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ToolCard, ToolCardLoading } from "./components/tool-card";
import { useMCPContext } from "@/providers/MCP";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import _ from "lodash";
import { Search } from "@/components/ui/tool-search";
import { useSearchTools } from "@/hooks/use-search-tools";

function TotalToolsBadge({
  toolsCount,
  loading,
  hasMore,
}: {
  toolsCount: number;
  loading: boolean;
  hasMore: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      {loading ? (
        <Badge variant="outline">Loading...</Badge>
      ) : (
        <Badge variant="outline">
          {toolsCount}
          {hasMore && "+"}
        </Badge>
      )}
    </span>
  );
}

/**
 * The parent component containing the tools interface.
 */
export default function ToolsInterface(): React.ReactNode {
  const { tools, loading, getTools, cursor, setTools } = useMCPContext();
  const { toolSearchTerm, debouncedSetSearchTerm, filteredTools } =
    useSearchTools(tools);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const handleLoadMore = async () => {
    if (!cursor) return;

    setLoadingMore(true);
    try {
      const newTools = await getTools(cursor);
      setTools((prevTools) => [...prevTools, ...newTools]);
    } catch (error) {
      console.error("Error loading more tools:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex w-full items-center justify-start gap-6">
        <div className="flex items-center justify-start gap-2">
          <Wrench className="size-6" />
          <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            Tools
            <TotalToolsBadge
              toolsCount={tools.length}
              loading={loading}
              hasMore={!!cursor}
            />
          </p>
        </div>
        <Search
          onSearchChange={debouncedSetSearchTerm}
          placeholder="Search tools..."
          className="w-full"
        />
      </div>

      <Separator />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading &&
          !filteredTools.length &&
          Array.from({ length: 6 }).map((_, index) => (
            <ToolCardLoading key={`tool-card-loading-${index}`} />
          ))}
        {filteredTools.map((tool, index) => (
          <ToolCard
            key={`${tool.name}-${index}`}
            tool={tool}
          />
        ))}
        {filteredTools.length === 0 && toolSearchTerm && (
          <p className="my-4 w-full text-center text-sm text-slate-500">
            No tools found matching "{toolSearchTerm}".
          </p>
        )}
        {tools.length === 0 && !toolSearchTerm && !loading && (
          <p className="my-4 w-full text-center text-sm text-slate-500">
            No tools available for this agent.
          </p>
        )}
      </div>

      {!toolSearchTerm && cursor && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            className="gap-1 px-2.5"
          >
            {loadingMore ? "Loading..." : "Load More Tools"}
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {loadingMore && (
        <div className="mt-4 flex justify-center">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ToolCardLoading key={`tool-card-loading-more-${index}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
