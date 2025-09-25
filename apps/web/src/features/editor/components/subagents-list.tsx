"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { SubAgent } from "@/types/sub-agent";
import { cn } from "@/lib/utils";

export function SubagentsList({
  subAgents,
  selectedIndex,
  onSelect,
}: {
  subAgents: SubAgent[];
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
}) {
  if (!subAgents?.length) {
    return (
      <div className="flex min-h-10 items-center px-2 py-1">
        <div className="text-muted-foreground text-xs">
          No sub-agents configured
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {subAgents.map((sa, idx) => (
        <div
          key={`${sa.name}-${idx}`}
          className={cn(
            "rounded-md p-2 transition-colors",
            selectedIndex === idx
              ? "border border-[#2F6868] bg-[#2F6868]/5"
              : "border border-gray-200 bg-gray-50 hover:border-[#2F6868]/30",
          )}
        >
          <button
            type="button"
            className="mb-1 w-full text-left text-sm font-medium text-gray-800 hover:underline"
            onClick={() => onSelect?.(idx)}
            title="Edit instructions for this sub-agent"
          >
            {sa.name || `Sub-agent ${idx + 1}`}
          </button>
          <div className="flex flex-wrap gap-1">
            {(sa.tools || []).length === 0 && (
              <span className="text-muted-foreground text-xs">No tools</span>
            )}
            {(sa.tools || []).map((tool) => (
              <Badge
                key={`${sa.name}-${tool}`}
                variant="outline"
                className="border-gray-300 text-gray-700"
              >
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
