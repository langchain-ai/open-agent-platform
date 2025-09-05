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

    // Start node - center it based on approximate width
    nodes.push({
      id: "start",
      type: "startEnd",
      position: { x: centerX - 50, y: currentY }, // 100px width / 2
      data: { label: "Start", type: "start" },
    });

    currentY += nodeSpacing;

    // Main agent node - center it based on approximate width
    nodes.push({
      id: "main-agent",
      type: "mainAgent",
      position: { x: centerX - 80, y: currentY }, // 160px width / 2
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

    // Get subagents and tools from configurable
    const subagents = configurable?.subagents || [];
    const tools = configurable?.tools?.tools || [];

    // Layout subagents horizontally
    if (subagents.length > 0) {
      const subagentSpacing = 280; // Increased spacing for better distribution
      const subagentWidth = 140; // Approximate width of subagent nodes
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

    // Layout tools below subagents
    if (tools.length > 0 && subagents.length > 0) {
      // Find the skill extractor subagent to connect tools to
      const skillExtractorIndex = subagents.findIndex((sub: any) => {
        const subName =
          typeof sub === "string" ? sub : sub?.name || String(sub);
        return (
          subName.toLowerCase().includes("skill") ||
          subName.toLowerCase().includes("extract")
        );
      });

      // Use skill extractor if found, otherwise use the last subagent
      const targetSubagentIndex =
        skillExtractorIndex >= 0 ? skillExtractorIndex : subagents.length - 1;
      const targetSubagentX =
        centerX -
        ((subagents.length - 1) * 250) / 2 +
        targetSubagentIndex * 250;

      tools.forEach((tool: any, index: number) => {
        const nodeId = `tool-${index}`;
        const toolLabel =
          typeof tool === "string" ? tool : tool?.name || String(tool);
        nodes.push({
          id: nodeId,
          type: "tool",
          position: { x: targetSubagentX, y: currentY },
          data: { label: toolLabel, type: "tool" },
        });

        edges.push({
          id: `subagent-${targetSubagentIndex}-to-${nodeId}`,
          source: `subagent-${targetSubagentIndex}`,
          target: nodeId,
          type: "smoothstep",
          style: {
            strokeDasharray: "5,5",
            strokeWidth: 2,
            stroke: "#64748b",
          },
        });
      });

      currentY += nodeSpacing;
    } else if (tools.length > 0 && subagents.length === 0) {
      // No subagents, connect tools directly to main agent
      tools.forEach((tool: any, index: number) => {
        const nodeId = `tool-${index}`;
        const toolLabel =
          typeof tool === "string" ? tool : tool?.name || String(tool);
        nodes.push({
          id: nodeId,
          type: "tool",
          position: { x: centerX, y: currentY },
          data: { label: toolLabel, type: "tool" },
        });

        edges.push({
          id: `agent-to-${nodeId}`,
          source: "main-agent",
          target: nodeId,
          type: "smoothstep",
          style: {
            strokeDasharray: "5,5",
            strokeWidth: 2,
            stroke: "#64748b",
          },
        });
      });

      currentY += nodeSpacing;
    }

    // End node - center it below the middle subagent or main agent
    const endX =
      subagents.length > 0
        ? centerX - 50 // Center below subagents
        : centerX - 50; // Center below main agent if no subagents

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
    <div className="h-96 w-full rounded-lg border bg-gray-50">
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
