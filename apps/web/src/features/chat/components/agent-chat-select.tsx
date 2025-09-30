"use client";

import React from "react";
import { useAgentsContext } from "@/providers/Agents";
import { useQueryState } from "nuqs";
import { getAgentColor } from "@/features/agents/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeployment } from "@/lib/environment/deployments";

export function AgentChatSelect(): React.ReactNode {
  const { agents } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useDeployment();
  const [_, setCurrentThreadId] = useQueryState("threadId");

  return (
    <Select
      value={agentId && deploymentId ? `${agentId}:${deploymentId}` : ""}
      onValueChange={async (v) => {
        const [aid, did] = v.split(":");
        await setAgentId(aid || null);
        await setDeploymentId(did || null);
        await setCurrentThreadId(null);
      }}
    >
      <SelectTrigger asChild>
        <button
          className="inline-flex items-center px-1 text-sm outline-none [&_[data-slot=select-value]]:flex"
          type="button"
        >
          <SelectValue
            placeholder={
              <span className="inline-flex items-center gap-2">
                <span className="size-[28px] flex-shrink-0 rounded-full border-2 border-dashed border-gray-400"></span>
                No agent selected
              </span>
            }
          />
        </button>
      </SelectTrigger>
      <SelectContent>
        {agents.map((a) => (
          <SelectItem
            key={`${a.assistant_id}:${a.deploymentId}`}
            value={`${a.assistant_id}:${a.deploymentId}`}
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="size-[28px] flex-shrink-0 rounded-full text-center text-xs leading-[28px] font-semibold text-white"
                style={{ backgroundColor: getAgentColor(a.name) }}
              >
                {a.name.slice(0, 2).toUpperCase()}
              </span>
              {a.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
