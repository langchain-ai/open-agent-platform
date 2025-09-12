"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolsCombobox } from "@/components/ui/tools-combobox";
import { Tool } from "@/types/tool";
import { ConfigFieldProps } from "./types";
import { SubAgentConfig } from "@/types/deep-agent";

interface ToolsFieldProps {
  agentIndex: number;
  tools: string[];
  updateSubAgent: (index: number, field: string, value: any) => void;
  toolsLoading: boolean;
  displayTools: Tool[];
  toolSearchTerm: string;
  debouncedSetSearchTerm: (value: string) => void;
  loadingMore: boolean;
  onLoadMore?: () => void;
  hasMore: boolean;
}

function ToolsField({
  agentIndex,
  tools,
  updateSubAgent,
  toolsLoading,
  displayTools,
  toolSearchTerm,
  debouncedSetSearchTerm,
  loadingMore,
  onLoadMore,
  hasMore,
}: ToolsFieldProps) {
  const handleToolsChange = (selectedTools: string | string[]) => {
    const toolsArray = Array.isArray(selectedTools)
      ? selectedTools
      : [selectedTools];
    updateSubAgent(agentIndex, "tools", toolsArray);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">Tools</Label>
      <ToolsCombobox
        tools={displayTools}
        toolsLoading={toolsLoading}
        value={tools}
        setValue={handleToolsChange}
        multiple={true}
        placeholder="Select tools..."
        className="text-sm"
        searchTerm={toolSearchTerm}
        onSearchChange={debouncedSetSearchTerm}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
      />
    </div>
  );
}

interface ConfigFieldSubAgentsProps
  extends Pick<
    ConfigFieldProps<SubAgentConfig[]>,
    "className" | "value" | "setValue"
  > {
  // Pagination and tool management props
  availableTools?: Tool[];
  toolsLoading?: boolean;
  displayTools?: Tool[];
  toolSearchTerm?: string;
  debouncedSetSearchTerm?: (value: string) => void;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  selectedMainTools?: string[];
}

export function ConfigFieldSubAgents({
  className,
  value,
  setValue,
  availableTools,
  toolsLoading,
  displayTools,
  toolSearchTerm,
  debouncedSetSearchTerm,
  loadingMore,
  onLoadMore,
  hasMore,
  selectedMainTools = [],
}: ConfigFieldSubAgentsProps) {
  const subAgents = value || [];

  const addSubAgent = () => {
    const newSubAgent = {
      name: "",
      description: "",
      prompt: "",
      tools: [...selectedMainTools], // Pre-populate with selected main tools
      mcp_server: process.env.NEXT_PUBLIC_MCP_SERVER_URL,
    };

    const newSubAgents = [...subAgents, newSubAgent];

    setValue(newSubAgents);
  };

  const removeSubAgent = (index: number) => {
    const newSubAgents = subAgents.filter((_, i) => i !== index);

    setValue(newSubAgents);
  };

  const updateSubAgent = (index: number, field: string, value: any) => {
    const newSubAgents = subAgents.map((agent, i) =>
      i === index ? { ...agent, [field]: value } : agent,
    );

    setValue(newSubAgents);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Sub Agents</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSubAgent}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Agent
        </Button>
      </div>

      <div className="space-y-4">
        {subAgents.map((subAgent, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Agent {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSubAgent(index)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Name Field */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Name</Label>
                <Input
                  value={subAgent.name || ""}
                  onChange={(e) =>
                    updateSubAgent(index, "name", e.target.value)
                  }
                  placeholder="Enter agent name"
                  className="text-sm"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={subAgent.description || ""}
                  onChange={(e) =>
                    updateSubAgent(index, "description", e.target.value)
                  }
                  placeholder="Enter agent description"
                  className="min-h-[60px] text-sm"
                />
              </div>

              {/* Prompt Field */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Prompt</Label>
                <Textarea
                  value={subAgent.prompt || ""}
                  onChange={(e) =>
                    updateSubAgent(index, "prompt", e.target.value)
                  }
                  placeholder="Enter agent prompt"
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Tools Field */}
              <ToolsField
                agentIndex={index}
                tools={subAgent.tools || []}
                updateSubAgent={updateSubAgent}
                toolsLoading={toolsLoading || false}
                displayTools={displayTools || availableTools || []}
                toolSearchTerm={toolSearchTerm || ""}
                debouncedSetSearchTerm={debouncedSetSearchTerm || (() => {})}
                loadingMore={loadingMore || false}
                onLoadMore={onLoadMore}
                hasMore={hasMore || false}
              />
            </div>
          </div>
        ))}
      </div>

      {subAgents.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          <p className="text-sm">No sub agents configured</p>
          <p className="text-xs">
            Click "Add Agent" to create your first sub agent
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Create custom agents with specific prompts and tools for specialized
        tasks.
      </p>
    </div>
  );
}
