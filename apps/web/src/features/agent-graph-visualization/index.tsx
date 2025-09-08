"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Edge,
  Background,
  Controls,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  StartEndNodeComponent,
  MainAgentNodeComponent,
  SubAgentNodeComponent,
  ToolNodeComponent,
} from "./nodes";

interface AgentGraphVisualizationProps {
  configurable: Record<string, any>;
  name: string;
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
