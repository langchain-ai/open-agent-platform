"use client";

import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface StartEndNodeData {
  label: string;
  type: "start" | "end";
}
export function StartEndNodeComponent({ data }: { data: StartEndNodeData }) {
  return (
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
}

interface MainAgentNodeData {
  label: string;
  type: "mainAgent";
}
export function MainAgentNodeComponent({ data }: { data: MainAgentNodeData }) {
  return (
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
}

interface SubAgentNodeData {
  label: string;
  type: "subagent";
}
export function SubAgentNodeComponent({ data }: { data: SubAgentNodeData }) {
  return (
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
}

interface ToolNodeData {
  label: string;
  type: "tool";
}
export function ToolNodeComponent({ data }: { data: ToolNodeData }) {
  return (
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
}
