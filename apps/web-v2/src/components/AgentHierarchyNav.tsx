"use client";

import React from "react";
import { Agent } from "@/types/agent";
import { SubAgent } from "@/types/sub-agent";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, FileText, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type EditTarget =
  | { type: "main"; agent: Agent }
  | { type: "subagent"; subAgent: SubAgent; index: number };

interface AgentHierarchyNavProps {
  agent: Agent;
  currentTarget: EditTarget;
  onTargetChange: (target: EditTarget) => void;
  onCreateSubAgent: () => void;
}

export function AgentHierarchyNav({
  agent,
  currentTarget,
  onTargetChange,
  onCreateSubAgent,
}: AgentHierarchyNavProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const subAgents =
    (agent?.config?.configurable?.subagents as SubAgent[]) || [];

  const isMainSelected = currentTarget.type === "main";

  return (
    <div className="w-64 bg-gray-50/50 p-4">
      <div className="space-y-2">
        {/* Main Agent */}
        <div
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
            isMainSelected
              ? "bg-[#2F6868] text-white"
              : "text-gray-700 hover:bg-gray-100",
          )}
          onClick={() => onTargetChange({ type: "main", agent })}
        >
          <FileText className="h-4 w-4" />
          <span className="font-medium">{agent.name}</span>
          <span className="text-xs opacity-75">(Main)</span>
        </div>

        {/* Sub-agents Section */}
        {subAgents.length > 0 && (
          <div>
            <div
              className="flex cursor-pointer items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Sub-agents ({subAgents.length})
            </div>

            {isExpanded && (
              <div className="ml-4 space-y-1">
                {subAgents.map((subAgent, index) => {
                  const isSelected =
                    currentTarget.type === "subagent" &&
                    currentTarget.index === index;

                  return (
                    <div
                      key={`${subAgent.name}-${index}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? "bg-[#2F6868] text-white"
                          : "text-gray-600 hover:bg-gray-100",
                      )}
                      onClick={() =>
                        onTargetChange({ type: "subagent", subAgent, index })
                      }
                    >
                      <Users className="h-4 w-4" />
                      <span>{subAgent.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create New Sub-agent Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateSubAgent}
          className="w-full justify-start gap-2 text-gray-600 hover:text-gray-900"
        >
          <Plus className="h-4 w-4" />
          Create Sub-agent
        </Button>
      </div>
    </div>
  );
}
