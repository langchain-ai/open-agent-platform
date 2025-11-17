"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Tool } from "@/types/tool";
import { ConfigFieldTool } from "./config-field";
import _ from "lodash";

interface ToolGroupSectionProps {
  groupName: string;
  tools: Tool[];
  agentId: string;
  toolId: string;
  source?: "graph" | "agent" | "excluded";
  enabledTools: string[];
  onToggleAll?: () => void;
  onToggleTool?: (toolName: string) => void;
}

export function ToolGroupSection({
  groupName,
  tools,
  agentId,
  toolId,
  source = "agent",
  enabledTools,
  onToggleAll,
}: ToolGroupSectionProps) {
  const enabledCount = tools.filter((t) =>
    enabledTools.includes(t.name),
  ).length;

  // Sub-group by tool_categories if available
  const categorized = _.groupBy(
    tools,
    (tool) => tool.metadata?.tool_categories?.[0] || "General",
  );

  const hasCategories = Object.keys(categorized).length > 1;

  return (
    <Collapsible
      defaultOpen={source === "graph"}
      className="mb-3 rounded-md border border-gray-200"
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          <h4 className="text-sm font-semibold text-gray-700">{groupName}</h4>
          <Badge
            variant="outline"
            className="text-xs"
          >
            {tools.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={enabledCount === tools.length ? "default" : "secondary"}
            className="text-xs"
          >
            {enabledCount} enabled
          </Badge>
          {source === "graph" && (
            <Badge
              variant="secondary"
              className="bg-blue-50 text-xs text-blue-700"
            >
              Graph-wide
            </Badge>
          )}
          {source === "agent" && (
            <Badge
              variant="secondary"
              className="bg-green-50 text-xs text-green-700"
            >
              Agent-only
            </Badge>
          )}
          {onToggleAll && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAll();
              }}
              className="h-6 px-2 text-xs"
            >
              Toggle All
            </Button>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 px-3 py-2">
        {hasCategories ? (
          // Render sub-grouped by category
          Object.entries(categorized).map(([category, categoryTools]) => (
            <div
              key={category}
              className="space-y-2"
            >
              <p className="text-xs font-medium tracking-wide text-gray-600 uppercase">
                {category}
              </p>
              <div className="ml-2 space-y-2 border-l-2 border-gray-100 pl-3">
                {categoryTools.map((tool) => (
                  <ConfigFieldTool
                    key={tool.name}
                    id={tool.name}
                    label={tool.name}
                    description={tool.description}
                    agentId={agentId}
                    toolId={toolId}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Render flat if no categories
          <div className="space-y-2">
            {tools.map((tool) => (
              <ConfigFieldTool
                key={tool.name}
                id={tool.name}
                label={tool.name}
                description={tool.description}
                agentId={agentId}
                toolId={toolId}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
