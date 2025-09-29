"use client";

import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import {
  AgentSummaryCard,
  ThreadHistoryAgentList,
} from "@/features/chat/components/thread-history-agent-list";
import {
  getThreadColor,
  useAgentSummaries,
  useThread,
} from "@/features/chat/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import useSWR, { mutate } from "swr";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { getAgentColor } from "@/features/agents/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DraftContext = createContext<
  [string | null, Dispatch<SetStateAction<string | null>>]
>([null, (state) => state]);

function ThreadSidebar() {
  const [_agentId, setAgentId] = useQueryState("agentId");
  const [_currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [sidebar, setSidebar] = useQueryState("sidebar");
  const [statusFilter, setStatusFilter] = useQueryState("status");
  const [draft] = useContext(DraftContext);

  return (
    <div className="absolute inset-0 grid grid-rows-[auto_1fr]">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-4 px-[18px]">
        <h2 className="flex flex-1 items-center gap-4 text-lg font-semibold whitespace-nowrap">
          Chat
          {sidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                const next = sidebar ? null : "1";
                await setSidebar(next);
              }}
              className="shadow-icon-button size-8 rounded-md border border-gray-300 bg-white p-3 text-gray-700 hover:bg-gray-100"
              title={sidebar ? "Exit full view" : "Expand chat"}
            >
              {!sidebar ? (
                <Minimize2 className="size-5" />
              ) : (
                <Maximize2 className="size-5" />
              )}
            </Button>
          )}
        </h2>
        <div className="flex w-full gap-2">
          {/* Status filter */}
          <Select
            value={(statusFilter as string) || "all"}
            onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
          >
            <SelectTrigger
              className="self-end"
              size="sm"
            >
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Active</SelectLabel>
                <SelectItem value="idle">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-2 rounded-full",
                        getThreadColor({ status: "idle" }),
                      )}
                    />
                    Idle
                  </span>
                </SelectItem>
                <SelectItem value="busy">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-2 rounded-full",
                        getThreadColor({ status: "busy" }),
                      )}
                    />
                    Busy
                  </span>
                </SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Attention</SelectLabel>
                <SelectItem value="interrupted">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-2 rounded-full",
                        getThreadColor({ status: "interrupted" }),
                      )}
                    />
                    Interrupted
                  </span>
                </SelectItem>
                <SelectItem value="error">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-2 rounded-full",
                        getThreadColor({ status: "error" }),
                      )}
                    />
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
          onThreadSelect={async (id, assistantId) => {
            // In "All agents" view, ensure we set the agent so sending works
            if (assistantId) {
              await setAgentId(assistantId);
            }
            await setCurrentThreadId(id);
          }}
          showDraft={draft ?? undefined}
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
    </div>
  );
}

function AgentChatIntro(props: { deploymentId: string }) {
  const { session } = useAuthContext();
  const [_sidebar, setSidebar] = useQueryState("sidebar");
  const [_agentId, setAgentId] = useQueryState("agentId");

  const recent = useSWR(
    { kind: "recent", deploymentId: props.deploymentId, session },
    async ({ deploymentId, session }) => {
      if (!deploymentId || !session?.accessToken) return [];
      const client = createClient(deploymentId, session.accessToken);
      return (
        await client.threads.search({
          limit: 5,
          sortBy: "updated_at",
          sortOrder: "desc",
        })
      ).filter((thread) => thread.metadata?.graph_id !== "agent_generator");
    },
  );

  const agents = useAgentSummaries();

  // Hide for now
  return <span />;

  if (recent.isLoading) {
    return (
      <div className="mx-4 flex flex-col items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">
          Loading recent threads...
        </div>
      </div>
    );
  }

  if (!recent.data?.length) {
    return (
      <div className="mx-4 flex flex-col items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">
          No recent threads found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <Tabs
        defaultValue="agents"
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          {agents.data?.map((summary) => (
            <AgentSummaryCard
              key={summary.agent.assistant_id}
              summary={summary}
              onClick={() => {
                setAgentId(summary.agent.assistant_id);
                setSidebar("1");
              }}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AgentChat(): React.ReactNode {
  const { session } = useAuthContext();
  const { agents } = useAgentsContext();

  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [threadId, setCurrentThreadId] = useQueryState("threadId");
  const [sidebar, setSidebar] = useQueryState("sidebar");
  const [_, setDraft] = useContext(DraftContext);

  const thread = useThread(threadId);
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

  return (
    <div className="absolute inset-0 grid grid-rows-[auto_1fr]">
      <div className="grid min-h-[64px] min-w-0 grid-cols-[1fr_auto] items-center p-4 px-[18px]">
        <span className="flex items-center gap-4 truncate text-lg font-semibold text-gray-800">
          {!sidebar && (
            <>
              Chat
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await setSidebar(sidebar ? null : "1");
                }}
                className="shadow-icon-button size-8 rounded-md border border-gray-300 bg-white p-3 text-gray-700 hover:bg-gray-100"
                title={!sidebar ? "Exit full view" : "Expand chat"}
              >
                {!sidebar ? (
                  <Minimize2 className="size-5" />
                ) : (
                  <Maximize2 className="size-5" />
                )}
              </Button>
            </>
          )}
        </span>

        {threadId && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!agentId) {
                  toast.info("Please select an agent", { richColors: true });
                  return;
                }
                await setCurrentThreadId(null);
              }}
              className="shadow-icon-button rounded-md border border-[#2F6868] bg-[#2F6868] p-3 text-white hover:bg-[#2F6868] hover:text-gray-50"
              disabled={!agentId}
            >
              <SquarePen className="size-5" />
              <span>New Conversation</span>
            </Button>
          </div>
        )}
      </div>

      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
        <DeepAgentChatInterface
          key={`chat-${deploymentId}`}
          thread={thread}
          assistant={
            agentId
              ? (agents.find((a) => a.assistant_id === agentId) ?? null)
              : null
          }
          deploymentUrl={selectedDeployment?.deploymentUrl || ""}
          accessToken={session.accessToken || ""}
          optimizerDeploymentUrl={selectedDeployment?.deploymentUrl || ""}
          optimizerAccessToken={session.accessToken || ""}
          mode="oap"
          SidebarTrigger={SidebarTrigger}
          DeepAgentChatBreadcrumb={DeepAgentChatBreadcrumb}
          hideInternalToggle={true}
          empty={
            !threadId ? <AgentChatIntro deploymentId={deploymentId} /> : null
          }
          onHistoryRevalidate={() => {
            mutate((key) => {
              if (typeof key !== "object" || key == null) return false;
              return "kind" in key && key.kind === "threads";
            });
          }}
          onInput={(input) => {
            if (agentId && threadId == null && input.length > 0) {
              setDraft(input);
            } else {
              setDraft(null);
            }
          }}
          view="chat"
          controls={
            <Select
              value={
                agentId && deploymentId ? `${agentId}:${deploymentId}` : ""
              }
              onValueChange={async (v) => {
                const [aid, did] = v.split(":");
                await setAgentId(aid || null);
                await setDeploymentId(did || null);
                // Clear any previously selected thread when switching agents
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
          }
        />
      </div>
    </div>
  );
}

function PageLayout() {
  const [agentId, setAgentId] = useQueryState("agentId");
  const [sidebar] = useQueryState("sidebar");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const draftState = useState<string | null>(null);
  const { agents } = useAgentsContext();

  useEffect(() => {
    if (agentId && deploymentId) {
      window.localStorage.setItem(
        "oap:lastAgentId",
        [agentId, deploymentId].join(":"),
      );
    }
  }, [agentId, deploymentId]);

  // Default to first agent if no agent is selected
  useEffect(() => {
    // TODO: make sure that user is not stuck when invalid agent ID or deployment ID is stored
    const [lastAgentId, lastDeploymentId] = (
      window.localStorage.getItem("oap:lastAgentId") ?? ""
    ).split(":");

    let targetDeploymentId = deploymentId;
    if (!targetDeploymentId) {
      const deployments = getDeployments();
      targetDeploymentId = deployments.at(0)?.id ?? null;
    }

    let targetAgentId = agentId;
    if (!targetAgentId) {
      if (lastDeploymentId === targetDeploymentId) {
        targetAgentId = lastAgentId;
      } else {
        targetAgentId = agents.at(0)?.assistant_id ?? null;
      }
    }

    if (agentId == null && targetAgentId != null) {
      setAgentId(targetAgentId);
    }

    if (deploymentId == null && targetDeploymentId != null) {
      setDeploymentId(targetDeploymentId);
    }
  }, [agents, deploymentId, agentId, setAgentId, setDeploymentId]);

  const isFullChat = !sidebar || agentId == null;

  return (
    <ResizablePanelGroup
      direction="horizontal"
      autoSaveId="chat"
    >
      <DraftContext.Provider value={draftState}>
        {!isFullChat && (
          <ResizablePanel
            id="thread-history"
            order={1}
            className="relative"
          >
            <ThreadSidebar />
          </ResizablePanel>
        )}

        {!isFullChat && <ResizableHandle />}

        <ResizablePanel
          id="chat"
          className="relative"
          order={2}
        >
          <AgentChat />
        </ResizablePanel>
      </DraftContext.Provider>
    </ResizablePanelGroup>
  );
}

export default function Page(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading…</div>}>
      <div className="flex h-screen flex-col">
        <AgentsProvider>
          <MCPProvider>
            <PageLayout />
          </MCPProvider>
        </AgentsProvider>
      </div>
    </React.Suspense>
  );
}
