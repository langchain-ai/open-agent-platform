"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { useAuthContext } from "@/providers/Auth";
import { useQueryState } from "nuqs";
import { Maximize2, Minimize2, SquarePen } from "lucide-react";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { getDeployments } from "@/lib/environment/deployments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

function ThreadHistoryHalf(): React.ReactNode {
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [fullChat] = useQueryState("fullChat");
  const [draft, setDraft] = useQueryState("draft");
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

  useEffect(() => {
    if (currentThreadId) {
      void setDraft(null);
    }
  }, [currentThreadId, setDraft]);

  const isFullChat = fullChat === "1";
  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="chat"
    >
      {!isFullChat && (
        <>
          <ResizablePanel
            id="thread-history"
            order={1}
          >
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-base font-semibold whitespace-nowrap">
                All Conversations
              </h2>
              <div className="flex w-full gap-2">
                {/* Agent selector */}
                <Select
                  value={
                    agentId && deploymentId ? `${agentId}:${deploymentId}` : ""
                  }
                  onValueChange={async (v) => {
                    if (v === "all") {
                      await setAgentId(null);
                      await setDeploymentId(null);
                      await setCurrentThreadId(null);
                      await setDraft(null);
                      return;
                    }
                    const [aid, did] = v.split(":");
                    await setAgentId(aid || null);
                    await setDeploymentId(did || null);
                    // Clear any previously selected thread when switching agents
                    await setCurrentThreadId(null);
                    await setDraft(null);
                  }}
                >
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue placeholder="All agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All agents</SelectItem>
                    <SelectSeparator />
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
                  <SelectTrigger className="h-8 flex-1">
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
            <div className="overflow-hidden border-gray-200 transition-all duration-300 ease-in-out">
              <ThreadHistoryAgentList
                agent={selectedAgent}
                deploymentId={deploymentId}
                currentThreadId={currentThreadId}
                showDraft={draft === "1"}
                onThreadSelect={async (id, assistantId) => {
                  // In "All agents" view, ensure we set the agent so sending works
                  if (assistantId) {
                    await setAgentId(assistantId);
                  }
                  await setCurrentThreadId(id);
                  await setDraft(null);
                }}
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
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}
      <ResizablePanel
        id="chat"
        className="relative"
        order={2}
      >
        <div className="absolute inset-0">
          <RightPaneChat />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

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
  const [threadId, setThreadId] = useQueryState("threadId");
  const [fullChat, setFullChat] = useQueryState("fullChat");
  const [draft, setDraft] = useQueryState("draft");
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

  // Guard missing essentials
  if (!deploymentId || !session?.accessToken) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
        Select an agent and a thread to view chat
      </div>
    );
  }

  // If no thread selected and not composing a draft, show placeholder
  if (!threadId && draft !== "1") {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
        No conversation selected
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="mb-0 flex items-center justify-between gap-2 px-6 pt-3 md:pt-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-gray-800 md:text-lg">
            {selectedAgent?.name || "Agent"}
          </h2>
          {typeof selectedAgent?.metadata?.description === "string" && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {selectedAgent.metadata.description as string}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              if (!agentId) {
                toast.info("Please select an agent", { richColors: true });
                return;
              }
              await setThreadId(null);
              await setDraft("1");
              setChatVersion((v) => v + 1);
            }}
            className="shadow-icon-button size-8 rounded-md border border-[#2F6868] bg-[#2F6868] p-3 text-white hover:bg-[#2F6868] hover:text-gray-50"
            title="Start new chat"
            disabled={!agentId}
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
          key={`chat-${agentId || "all"}-${deploymentId}-${chatVersion}`}
          assistantId={agentId || ""}
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
