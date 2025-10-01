"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
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
  return (
    <div
      className={cn("rounded-md p-2", subAgents.length > 0 ? "bg-gray-50" : "")}
    >
      <div className="flex flex-wrap gap-1">
        {subAgents.length === 0 && (
          <span className="text-xs text-gray-500">No subagents configured</span>
        )}
        {subAgents.map((sa, idx) => (
          <Badge
            key={`subagent-${idx}`}
            variant="outline"
            className="cursor-pointer border-gray-300 text-gray-700 hover:border-[#2F6868]/50"
            onClick={() => onSelect?.(idx)}
            title={`Edit ${sa.name || `Subagent ${idx + 1}`}`}
          >
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 text-[#2F6868]" />
              <span className="truncate">
                {sa.name || `Subagent ${idx + 1}`}
              </span>
            </span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
