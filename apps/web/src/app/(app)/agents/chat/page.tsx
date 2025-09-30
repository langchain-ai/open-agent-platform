"use client";

import React, {
  createContext,
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { useAuthContext } from "@/providers/Auth";
import { useQueryState } from "nuqs";
import { Check, Edit, MessagesSquareIcon, SquarePen } from "lucide-react";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { getDeployments, useDeployment } from "@/lib/environment/deployments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NextLink from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DeepAgentChatBreadcrumb } from "@/features/chat/components/breadcrumb";
import { useAgentsContext } from "@/providers/Agents";
import { Skeleton } from "@/components/ui/skeleton";
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
import { getThreadColor, useAgentSummaries } from "@/features/chat/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import useSWR from "swr";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { getAgentColor } from "@/features/agents/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Agent } from "@/types/agent";
import { SupportedConfigBadge } from "@/features/agents/components/agent-card";

const DraftContext = createContext<
  [string | null, Dispatch<SetStateAction<string | null>>]
>([null, (state) => state]);

function AgentChatThreadButton() {
  const [sidebar, setSidebar] = useQueryState("sidebar");

  return (
    <span className="flex flex-1 items-center gap-4 text-lg font-semibold whitespace-nowrap">
      Chat
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          const next = sidebar ? null : "1";
          await setSidebar(next);
        }}
        className="shadow-icon-button rounded-md border border-gray-300 bg-white p-3 text-gray-700 hover:bg-gray-100"
        title={sidebar ? "Exit full view" : "Expand chat"}
      >
        <MessagesSquareIcon />
        Threads
      </Button>
    </span>
  );
}

function ThreadSidebar(props: { mutateThreadsRef: RefObject<() => void> }) {
  const [_agentId, setAgentId] = useQueryState("agentId");
  const [_currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [sidebar] = useQueryState("sidebar");
  const [statusFilter, setStatusFilter] = useQueryState("status");
  const [draft] = useContext(DraftContext);

  return (
    <div className="absolute inset-0 grid grid-rows-[auto_1fr]">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-4 px-[18px]">
        <h2>{sidebar && <AgentChatThreadButton />}</h2>
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
          mutateThreadsRef={props.mutateThreadsRef}
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

function AgentChatSelectItem(props: {
  agent: Agent;
  checked?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-2",
        props.className,
      )}
    >
      <span
        className="size-[28px] flex-shrink-0 rounded-full text-center text-xs leading-[28px] font-semibold text-white"
        style={{ backgroundColor: getAgentColor(props.agent.name) }}
      >
        {props.agent.name.slice(0, 2).toUpperCase()}
      </span>
      {props.agent.name}
      {props.checked && <Check className="ml-3 size-4" />}
    </span>
  );
}

function AgentChatSelect() {
  const { agents } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useDeployment();
  const [_currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [open, setOpen] = useState(false);

  const [hoverAgentId, setHoverAgentId] = useState<string | null>(agentId);
  const [input, setInput] = useState("");

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(input.toLowerCase()),
  );

  const prevOpen = useRef(open);

  if (prevOpen.current !== open) {
    prevOpen.current = open;

    if (open) {
      setHoverAgentId(agentId);
      setInput("");
    }
  }

  const selectedAgent =
    agentId && deploymentId
      ? agents.find(
          (agent) =>
            agent.assistant_id === agentId &&
            agent.deploymentId === deploymentId,
        )
      : null;

  const hoverAgent = hoverAgentId
    ? agents.find((agent) => agent.assistant_id === hoverAgentId)
    : null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center px-1 text-sm outline-none [&_[data-slot=select-value]]:flex"
          type="button"
        >
          {selectedAgent ? (
            <AgentChatSelectItem agent={selectedAgent} />
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="size-[28px] flex-shrink-0 rounded-full border-2 border-dashed border-gray-400"></span>
              No agent selected
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <div className="grid grid-cols-[auto_1fr]">
          <Command
            shouldFilter={false}
            value={hoverAgentId ?? ""}
            onValueChange={setHoverAgentId}
          >
            <CommandInput
              placeholder="Search agents..."
              value={input}
              onValueChange={setInput}
            />
            <CommandList>
              <CommandEmpty>No agents found.</CommandEmpty>
              {filteredAgents.map((agent) => (
                <CommandItem
                  key={agent.assistant_id}
                  className="rounded-none"
                  value={agent.assistant_id}
                  onSelect={() => {
                    setAgentId(agent.assistant_id);
                    setDeploymentId(agent.deploymentId);
                    setCurrentThreadId(null);
                    setOpen(false);
                  }}
                >
                  <AgentChatSelectItem
                    className="w-full"
                    agent={agent}
                    checked={agent.assistant_id === agentId}
                  />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
          {hoverAgent && (
            <div className="flex max-h-[300px] w-80 flex-col overflow-x-hidden overflow-y-auto border-l">
              <div className="bg-background sticky top-0 grid grid-cols-[auto_1fr] items-center gap-2 px-3 pt-3 pr-8 pb-1.5">
                <div
                  className="size-[28px] flex-shrink-0 rounded-full text-center text-xs leading-[28px] font-semibold text-white"
                  style={{ backgroundColor: getAgentColor(hoverAgent?.name) }}
                >
                  {hoverAgent?.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate text-sm">{hoverAgent?.name}</div>
              </div>

              <div className="space-y-2 px-3 py-1.5">
                {typeof hoverAgent.metadata?.description === "string" && (
                  <div className="text-muted-foreground text-sm">
                    {hoverAgent.metadata?.description}
                  </div>
                )}

                {!!hoverAgent.supportedConfigs?.length && (
                  <div className="flex flex-wrap gap-2">
                    {hoverAgent.supportedConfigs?.map((config) => (
                      <SupportedConfigBadge
                        key={config}
                        type={config}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1" />

              <div className="bg-background sticky bottom-0 px-3 pt-1.5 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <NextLink
                    href={`/editor?agentId=${hoverAgent.assistant_id}&deploymentId=${hoverAgent.deploymentId}`}
                  >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </NextLink>
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <Select
      value={agentId && deploymentId ? `${agentId}:${deploymentId}` : ""}
      onValueChange={async (v) => {
        const [aid, did] = v.split(":");
        await setAgentId(aid || null);
        await setDeploymentId(did || null);
        // Clear any previously selected thread when switching agents
        await setCurrentThreadId(null);
      }}
    >
      <SelectTrigger asChild></SelectTrigger>
      <SelectContent>
        {agents.map((a) => (
          <SelectItem
            key={`${a.assistant_id}:${a.deploymentId}`}
            value={`${a.assistant_id}:${a.deploymentId}`}
          ></SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AgentChat(props: {
  mutateThreadsRef: RefObject<() => void>;
}): React.ReactNode {
  const { session } = useAuthContext();
  const { agents } = useAgentsContext();

  const [agentId] = useQueryState("agentId");
  const [deploymentId] = useDeployment();
  const [threadId, setCurrentThreadId] = useQueryState("threadId");
  const [sidebar] = useQueryState("sidebar");
  const [_, setDraft] = useContext(DraftContext);

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
          {!sidebar && <AgentChatThreadButton />}
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
          skeleton={<ChatThreadSkeleton />}
          onHistoryRevalidate={() => props.mutateThreadsRef.current?.()}
          onInput={(input) => {
            if (agentId && threadId == null && input.length > 0) {
              setDraft(input);
            } else {
              setDraft(null);
            }
          }}
          view="chat"
          controls={<AgentChatSelect />}
        />
      </div>
    </div>
  );
}

function PageLayout() {
  const [agentId, setAgentId] = useQueryState("agentId");
  const [sidebar] = useQueryState("sidebar");
  const [deploymentId, setDeploymentId] = useDeployment();
  const draftState = useState<string | null>(null);
  const mutateThreadsRef = useRef<() => void>(() => void 0);
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

    let targetAgentId = agentId;
    if (!targetAgentId) {
      if (lastDeploymentId === deploymentId) {
        targetAgentId = lastAgentId;
      } else {
        targetAgentId = agents.at(0)?.assistant_id ?? null;
      }
    }

    if (agentId == null && targetAgentId != null) {
      setAgentId(targetAgentId);
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
            defaultSize={30}
            className="relative"
          >
            <ThreadSidebar mutateThreadsRef={mutateThreadsRef} />
          </ResizablePanel>
        )}

        {!isFullChat && <ResizableHandle />}

        <ResizablePanel
          id="chat"
          className="relative"
          order={2}
        >
          <AgentChat mutateThreadsRef={mutateThreadsRef} />
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

function ChatThreadSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto py-4">
        {/* Human message */}
        <div className="flex items-start justify-end gap-3">
          <div className="max-w-[75%] flex-1 space-y-2">
            <div className="flex justify-end">
              <Skeleton className="h-4 w-[60%] rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-4 w-[35%] rounded-2xl" />
            </div>
          </div>
        </div>

        {/* AI message */}
        <div className="flex items-start gap-3">
          <div className="max-w-[75%] flex-1 space-y-2">
            <Skeleton className="h-4 w-[80%] rounded-2xl" />
            <Skeleton className="h-4 w-[65%] rounded-2xl" />
            <Skeleton className="h-4 w-[45%] rounded-2xl" />
          </div>
        </div>

        {/* Human message */}
        <div className="flex items-start justify-end gap-3">
          <div className="max-w-[75%] flex-1 space-y-2">
            <div className="flex justify-end">
              <Skeleton className="h-4 w-[45%] rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-4 w-[20%] rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-4 w-[32%] rounded-2xl" />
            </div>
          </div>
        </div>

        {/* AI message */}
        <div className="flex items-start gap-3">
          <div className="max-w-[75%] flex-1 space-y-2">
            <Skeleton className="h-4 w-[70%] rounded-2xl" />
            <Skeleton className="h-4 w-[50%] rounded-2xl" />
            <Skeleton className="h-4 w-[30%] rounded-2xl" />
            <Skeleton className="h-4 w-[90%] rounded-2xl" />
            <Skeleton className="h-4 w-[85%] rounded-2xl" />
            <Skeleton className="h-4 w-[40%] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
