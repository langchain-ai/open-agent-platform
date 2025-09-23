"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { useAuthContext } from "@/providers/Auth";
import { useQueryState } from "nuqs";
import { createClient } from "@/lib/client";
import type { Message } from "@langchain/langgraph-sdk";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { getDeployments } from "@/lib/environment/deployments";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DeepAgentChatBreadcrumb } from "@/features/chat/components/breadcrumb";
import { useAgentsContext } from "@/providers/Agents";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThreadHistoryAgentList } from "@/features/chat/components/thread-history-agent-list";

// (Thread list handled by ThreadHistoryAgentList)

function ThreadHistoryHalf(): React.ReactNode {
  const { session } = useAuthContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [fullChat] = useQueryState("fullChat");

  const client = useMemo(() => {
    if (!deploymentId || !session?.accessToken) return null;
    return createClient(deploymentId, session.accessToken);
  }, [deploymentId, session]);

  const { agents } = useAgentsContext();
  const selectedAgent = useMemo(
    () => agents.find((a) => a.assistant_id === agentId) || null,
    [agents, agentId],
  );
  const [statusFilter, setStatusFilter] = useQueryState("status");

  // Default to first deployment so the thread list can load when nothing is selected
  useEffect(() => {
    if (!deploymentId) {
      const deployments = getDeployments();
      if (deployments.length > 0) {
        void setDeploymentId(deployments[0].id);
      }
    }
  }, [deploymentId, setDeploymentId]);

  // List data is fetched inside ThreadHistoryAgentList

  const isFullChat = fullChat === "1";
  return (
    <div className="flex h-full w-full">
      <div
        className={cn(
          "overflow-hidden border-gray-200 transition-all duration-300 ease-in-out",
          isFullChat ? "w-0 border-r-0" : "w-1/2 border-r",
        )}
        aria-hidden={isFullChat}
      >
          <div className="border-b p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold">All Conversations</h2>
              <div className="flex items-center gap-2">
                {/* Agent selector */}
                <Select
                  value={agentId && deploymentId ? `${agentId}:${deploymentId}` : ""}
                  onValueChange={async (v) => {
                    const [aid, did] = v.split(":");
                    await setAgentId(aid || null);
                    await setDeploymentId(did || null);
                  }}
                >
                  <SelectTrigger className="h-8 w-[240px]">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem
                        key={`${a.assistant_id}:${a.deploymentId}`}
                        value={`${a.assistant_id}:${a.deploymentId}`}
                      >
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status filter */}
                <Select
                  value={(statusFilter as string) || "all"}
                  onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
                >
                <SelectTrigger className="h-8 w-[220px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Active</SelectLabel>
                    <SelectItem value="idle">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-green-500" />
                        Idle
                      </span>
                    </SelectItem>
                    <SelectItem value="busy">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-yellow-400" />
                        Busy
                      </span>
                    </SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Attention</SelectLabel>
                    <SelectItem value="interrupted">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-red-500" />
                        Interrupted
                      </span>
                    </SelectItem>
                    <SelectItem value="error">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-red-600" />
                        Error
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>
          <ThreadHistoryAgentList
            agent={selectedAgent}
            deploymentId={deploymentId}
            currentThreadId={currentThreadId}
            onThreadSelect={(id) => setCurrentThreadId(id)}
            statusFilter={
              ((statusFilter as string) || "all") as
                | "all"
                | "idle"
                | "busy"
                | "interrupted"
                | "error"
            }
          />
        </div>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isFullChat ? "w-full" : "w-1/2",
        )}
      >
        <RightPaneChat />
      </div>
    </div>
  );
}

// (Old ThreadRow removed)

export default function AgentsChatHalf(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading…</div>}>
      <div className="flex h-screen flex-col">
        <AgentsProvider>
          <MCPProvider>
            <ThreadHistoryHalf />
          </MCPProvider>
        </AgentsProvider>
      </div>
    </React.Suspense>
  );
}

function RightPaneChat(): React.ReactNode {
  const { session } = useAuthContext();
  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useQueryState("deploymentId");
  const [_threadId, setThreadId] = useQueryState("threadId");
  const [fullChat, setFullChat] = useQueryState("fullChat");
  const [chatVersion, setChatVersion] = useState(0);

  const { agents } = useAgentsContext();
  const selectedAgent = useMemo(
    () => agents.find((a) => a.assistant_id === agentId) || null,
    [agents, agentId],
  );

  const deployments = getDeployments();
  const selectedDeployment = useMemo(
    () => deployments.find((d) => d.id === deploymentId),
    [deployments, deploymentId],
  );

  if (!agentId || !deploymentId || !session?.accessToken) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Select an agent and a thread to view chat
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="mb-0 flex items-center justify-between gap-2 px-6 pt-3 md:pt-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800 md:text-lg truncate">
            {selectedAgent?.name || "Agent"}
          </h2>
          {typeof selectedAgent?.metadata?.description === "string" && (
            <p className="text-muted-foreground text-xs truncate">
              {selectedAgent.metadata.description as string}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await setThreadId(null);
              setChatVersion((v) => v + 1);
            }}
            className="shadow-icon-button size-8 rounded-md border border-[#2F6868] bg-[#2F6868] p-3 text-white hover:bg-[#2F6868] hover:text-gray-50"
            title="Start new chat"
          >
            <SquarePen className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              const next = fullChat === "1" ? null : "1";
              await setFullChat(next);
            }}
            className="shadow-icon-button size-8 rounded-md border border-gray-300 bg-white p-3 text-gray-700 hover:bg-gray-100"
            title={fullChat === "1" ? "Exit full view" : "Expand chat"}
          >
            {fullChat === "1" ? (
              <Minimize2 className="size-5" />
            ) : (
              <Maximize2 className="size-5" />
            )}
          </Button>
        </div>
      </div>
      <div className="-mt-2 flex min-h-0 flex-1 flex-col pb-6">
        <DeepAgentChatInterface
          key={`chat-${agentId}-${deploymentId}-${chatVersion}`}
          assistantId={agentId}
          deploymentUrl={selectedDeployment?.deploymentUrl || ""}
          accessToken={session.accessToken || ""}
          optimizerDeploymentUrl={
            process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || ""
          }
          optimizerAccessToken={session.accessToken || ""}
          mode="oap"
          SidebarTrigger={SidebarTrigger}
          DeepAgentChatBreadcrumb={DeepAgentChatBreadcrumb}
          hideInternalToggle={true}
          hideSidebar={true}
          view="chat"
        />
      </div>
    </div>
  );
}

