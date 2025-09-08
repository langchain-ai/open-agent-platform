"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Edge,
  Background,
  Controls,
  Handle,
  Position,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface AgentGraphVisualizationProps {
  configurable: Record<string, any>;
  name: string;
}

interface StartEndNodeData {
  label: string;
  type: "start" | "end";
}

interface MainAgentNodeData {
  label: string;
  type: "mainAgent";
}

interface SubAgentNodeData {
  label: string;
  type: "subagent";
}

interface ToolNodeData {
  label: string;
  type: "tool";
}

interface SubAgentNode {
  id: string;
  type: "subagent";
  position: { x: number; y: number };
  data: { label: string; type: "subagent" };
}

interface ToolNode {
  id: string;
  type: "tool";
  position: { x: number; y: number };
  data: { label: string; type: "tool" };
}

interface StartEndNode {
  id: string;
  type: "startEnd";
  position: { x: number; y: number };
  data: { label: string; type: "start" | "end" };
}

interface MainAgentNode {
  id: string;
  type: "mainAgent";
  position: { x: number; y: number };
  data: { label: string; type: "mainAgent" };
}

type GraphNode = SubAgentNode | ToolNode | StartEndNode | MainAgentNode;

const StartEndNodeComponent = ({ data }: { data: StartEndNodeData }) => (
  <div className="min-w-[100px] rounded-lg border-2 border-gray-800 bg-white px-6 py-3 text-center font-medium shadow-lg">
    {data.type === "start" && (
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
    )}
    <div className="flex items-center justify-center">{data.label}</div>
    {data.type === "end" && (
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
    )}
  </div>
);

const MainAgentNodeComponent = ({ data }: { data: MainAgentNodeData }) => (
  <div className="min-w-[160px] rounded-lg border-2 border-yellow-500 bg-yellow-100 px-6 py-3 text-center font-medium shadow-lg">
    <Handle
      type="target"
      position={Position.Top}
      className="!bg-gray-400"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />
    <div className="flex items-center justify-center">{data.label}</div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="!bg-gray-400"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />
  </div>
);

const SubAgentNodeComponent = ({ data }: { data: SubAgentNodeData }) => (
  <div className="min-w-[140px] rounded-lg border-2 border-purple-500 bg-purple-100 px-4 py-4 text-center shadow-lg">
    <Handle
      type="target"
      position={Position.Top}
      className="!bg-gray-400"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="text-sm font-medium">{data.label}</div>
      <div className="rounded bg-purple-200 px-3 py-1 text-xs text-purple-800">
        subagent
      </div>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="!bg-gray-400"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />
  </div>
);

const ToolNodeComponent = ({ data }: { data: ToolNodeData }) => (
  <div className="min-w-[140px] rounded-lg border-2 border-green-500 bg-green-100 px-4 py-4 text-center shadow-lg">
    <Handle
      type="target"
      position={Position.Top}
      className="!bg-gray-400"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="text-sm font-medium">{data.label}</div>
      <div className="rounded bg-green-200 px-3 py-1 text-xs text-green-800">
        Tool
      </div>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      className="!bg-gray-400"
      style={{ left: "50%", transform: "translateX(-50%)" }}
    />
  </div>
);

const nodeTypes = {
  startEnd: StartEndNodeComponent,
  mainAgent: MainAgentNodeComponent,
  subagent: SubAgentNodeComponent,
  tool: ToolNodeComponent,
};

export function AgentGraphVisualization({
  configurable,
  name,
}: AgentGraphVisualizationProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: Edge[] = [];

    let currentY = 50;
    const centerX = 400;
    const nodeSpacing = 150;

    nodes.push({
      id: "start",
      type: "startEnd",
      position: { x: centerX - 50, y: currentY },
      data: { label: "Start", type: "start" },
    });

    currentY += nodeSpacing;

    nodes.push({
      id: "main-agent",
      type: "mainAgent",
      position: { x: centerX - 80, y: currentY },
      data: { label: name, type: "mainAgent" },
    });

    edges.push({
      id: "start-to-agent",
      source: "start",
      target: "main-agent",
      type: "smoothstep",
      sourceHandle: null,
      targetHandle: null,
    });

    currentY += nodeSpacing;

    // Get subagents from configurable
    const subagents = configurable?.subagents || [];

    // Layout subagents horizontally
    if (subagents.length > 0) {
      const subagentSpacing = 280;
      const subagentWidth = 140;
      const totalWidth = (subagents.length - 1) * subagentSpacing;
      const startX = centerX - totalWidth / 2 - subagentWidth / 2;

      subagents.forEach((subagent: any, index: number) => {
        const nodeId = `subagent-${index}`;
        const subagentLabel =
          typeof subagent === "string"
            ? subagent
            : subagent?.name || String(subagent);
        nodes.push({
          id: nodeId,
          type: "subagent",
          position: { x: startX + index * subagentSpacing, y: currentY },
          data: { label: subagentLabel, type: "subagent" },
        });

        edges.push({
          id: `agent-to-${nodeId}`,
          source: "main-agent",
          target: nodeId,
          type: "smoothstep",
        });
      });

      currentY += nodeSpacing;
    }

    // Layout tools below subagents - each subagent gets its own tools
    if (subagents.length > 0) {
      let maxToolsCount = 0;

      subagents.forEach((subagent: any) => {
        const subagentTools = subagent?.tools || [];
        maxToolsCount = Math.max(maxToolsCount, subagentTools.length);
      });

      subagents.forEach((subagent: any, subagentIndex: number) => {
        const subagentSpacing = 280;
        const subagentWidth = 140;
        const totalWidth = (subagents.length - 1) * subagentSpacing;
        const startX = centerX - totalWidth / 2 - subagentWidth / 2;
        const subagentX = startX + subagentIndex * subagentSpacing;

        // Get tools for this specific subagent
        const subagentTools = subagent?.tools || [];

        // Create tools for this specific subagent
        subagentTools.forEach((tool: any, toolIndex: number) => {
          const nodeId = `tool-${subagentIndex}-${toolIndex}`;
          const toolLabel =
            typeof tool === "string" ? tool : tool?.name || String(tool);

          const toolSpacing = 90;
          const totalToolsHeight = (maxToolsCount - 1) * toolSpacing;
          const thisSubagentHeight = (subagentTools.length - 1) * toolSpacing;
          const offset = (totalToolsHeight - thisSubagentHeight) / 2;

          const toolY = currentY + offset + toolIndex * toolSpacing;

          nodes.push({
            id: nodeId,
            type: "tool",
            position: { x: subagentX, y: toolY },
            data: { label: toolLabel, type: "tool" },
          });

          // Only connect first tool to subagent, other tools are just stacked
          if (toolIndex === 0) {
            edges.push({
              id: `subagent-${subagentIndex}-to-${nodeId}`,
              source: `subagent-${subagentIndex}`,
              target: nodeId,
              type: "smoothstep",
              style: {
                strokeDasharray: "5,5",
                strokeWidth: 2,
                stroke: "#64748b",
              },
            });
          }
        });
      });

      // Update currentY to account for the tallest column of tools
      if (maxToolsCount > 0) {
        currentY += nodeSpacing + (maxToolsCount - 1) * 90;
      }
    }

    // End node - center it below the middle subagent or main agent
    const endX = subagents.length > 0 ? centerX - 50 : centerX - 50;

    nodes.push({
      id: "end",
      type: "startEnd",
      position: { x: endX, y: currentY },
      data: { label: "End", type: "end" },
    });

    // Connect terminal nodes to end - always from subagents to end
    if (subagents.length > 0) {
      // Subagents always connect to end (tools are intermediate)
      subagents.forEach((_: any, index: number) => {
        edges.push({
          id: `subagent-${index}-to-end`,
          source: `subagent-${index}`,
          target: "end",
          type: "smoothstep",
        });
      });
    } else {
      // If no subagents, main agent connects to end
      edges.push({
        id: "main-agent-to-end",
        source: "main-agent",
        target: "end",
        type: "smoothstep",
      });
    }

    return { nodes, edges };
  }, [configurable, name]);

  return (
    <div className="h-full min-h-[80vh] w-full rounded-lg border bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 2, stroke: "#64748b" },
          markerEnd: {
            type: "arrowclosed",
            color: "#64748b",
          },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
