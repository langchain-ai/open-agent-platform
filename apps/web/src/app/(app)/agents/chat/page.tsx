"use client";

import React, { useEffect, useMemo } from "react";
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
import useSWR from "swr";
import { createClient } from "@/lib/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  extractStringFromMessageContent,
  truncateText,
} from "@/features/chat/utils";
import { Thread } from "@langchain/langgraph-sdk";

const getAgentColor = (name: string | undefined) => {
  const firstChar = name?.charAt(0).toLowerCase();
  switch (firstChar) {
    case "a":
      return "bg-[#2F6868]";
    case "b":
      return "bg-[#3D7575]";
    case "c":
      return "bg-[#4B8282]";
    case "d":
      return "bg-[#599090]";
    case "e":
      return "bg-[#679D9D]";
    case "f":
      return "bg-[#75AAAA]";
    case "g":
      return "bg-[#83B7B7]";
    case "h":
      return "bg-[#91C4C4]";
    case "i":
      return "bg-[#9FD1D1]";
    case "j":
      return "bg-[#ADDEDE]";
    case "k":
      return "bg-[#3D7575]";
    case "l":
      return "bg-[#4B8282]";
    case "m":
      return "bg-[#599090]";
    case "n":
      return "bg-[#679D9D]";
    case "o":
      return "bg-[#75AAAA]";
    case "p":
      return "bg-[#83B7B7]";
    case "q":
      return "bg-[#91C4C4]";
    case "r":
      return "bg-[#9FD1D1]";
    case "s":
      return "bg-[#ADDEDE]";
    case "t":
      return "bg-[#3D7575]";
    case "u":
      return "bg-[#4B8282]";
    case "v":
      return "bg-[#599090]";
    case "w":
      return "bg-[#679D9D]";
    case "x":
      return "bg-[#75AAAA]";
    case "y":
      return "bg-[#83B7B7]";
    case "z":
      return "bg-[#91C4C4]";
    default:
      return "bg-[#2F6868]";
  }
};

function ThreadHistoryHalf(): React.ReactNode {
  const [_, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [currentThreadId, setCurrentThreadId] = useQueryState("threadId");
  const [fullChat] = useQueryState("fullChat");
  const [draft, setDraft] = useQueryState("draft");

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
    <>
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="chat"
      >
        {!isFullChat && (
          <>
            <ResizablePanel
              id="thread-history"
              order={1}
              className="relative"
            >
              <div className="absolute inset-0 grid grid-rows-[auto_1fr]">
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b p-4">
                  <h2 className="flex-1 text-lg font-semibold whitespace-nowrap">
                    Chat
                  </h2>
                  <div className="flex w-full gap-2">
                    {/* Status filter */}
                    <Select
                      value={(statusFilter as string) || "all"}
                      onValueChange={(v) =>
                        setStatusFilter(v === "all" ? null : v)
                      }
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
          <RightPaneChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}

function AgentChatItem({
  thread,
  interrupted,
}: {
  thread: Thread;
  interrupted?: boolean;
}) {
  const [_threadId, setCurrentThreadId] = useQueryState("threadId");
  const [_agentId, setAgentId] = useQueryState("agentId");
  const { agents } = useAgentsContext();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return format(date, "HH:mm");
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return format(date, "EEEE");
    } else {
      return format(date, "MM/dd");
    }
  };

  const extractThreadTitle = (thread: any) => {
    try {
      if (
        thread.values &&
        typeof thread.values === "object" &&
        "messages" in thread.values
      ) {
        const messages = (thread.values as { messages?: unknown[] }).messages;
        if (Array.isArray(messages) && messages.length > 0) {
          const lastHuman = messages
            .filter((m: any) => m.type === "human")
            .at(-1);
          if (lastHuman) {
            const content = extractStringFromMessageContent(lastHuman as any);
            return truncateText(content, 60);
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to get title for thread ${thread.thread_id}:`, err);
    }
    return `Thread ${thread.thread_id.slice(0, 8)}`;
  };

  const extractThreadDescription = (thread: any) => {
    try {
      if (
        thread.values &&
        typeof thread.values === "object" &&
        "messages" in thread.values
      ) {
        const messages = (thread.values as { messages?: unknown[] }).messages;
        if (Array.isArray(messages) && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const content = extractStringFromMessageContent(lastMessage as any);
          return truncateText(content, 80);
        }
      }
    } catch (err) {
      console.warn(
        `Failed to get description for thread ${thread.thread_id}:`,
        err,
      );
    }
    return "No messages";
  };

  const getAgentForThread = (thread: Thread) => {
    const meta = (thread as unknown as { metadata?: Record<string, unknown> })
      .metadata;
    const assistantId =
      (meta?.["assistant_id"] as string | undefined) || undefined;

    if (assistantId) {
      return agents.find((agent) => agent.assistant_id === assistantId);
    }
    return null;
  };

  const handleThreadSelect = async (thread: Thread) => {
    // Extract assistant_id from thread metadata if available
    const meta = (thread as unknown as { metadata?: Record<string, unknown> })
      .metadata;
    const assistantId =
      (meta?.["assistant_id"] as string | undefined) || undefined;

    if (assistantId) {
      await setAgentId(assistantId);
    }
    await setCurrentThreadId(thread.thread_id);
  };

  const agent = getAgentForThread(thread);

  return (
    <button
      key={thread.thread_id}
      onClick={() => handleThreadSelect(thread)}
      className="w-full rounded-lg border p-3 text-left transition-colors duration-200 hover:bg-gray-50"
    >
      <div className="flex items-start gap-3">
        {/* Agent Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white",
              getAgentColor(agent?.name || "A"),
            )}
          >
            {agent?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          {interrupted && (
            <span className="border-sidebar absolute -right-0.5 -bottom-0.5 flex h-3 w-3 items-center justify-center rounded-full border-[2px] bg-red-500 text-xs text-white" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-gray-900">
                {extractThreadTitle(thread)}
              </h3>
              <p className="mt-1 truncate text-xs text-gray-600">
                {extractThreadDescription(thread)}
              </p>
            </div>
            <div className="ml-3 flex flex-col items-end">
              <span className="text-xs text-gray-500">
                {formatTime(new Date(thread.updated_at || thread.created_at))}
              </span>
              <div className="mt-1 flex items-center gap-1">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    thread.status === "idle"
                      ? "bg-green-500"
                      : thread.status === "busy"
                        ? "bg-yellow-400"
                        : thread.status === "interrupted"
                          ? "bg-red-500"
                          : thread.status === "error"
                            ? "bg-red-600"
                            : "bg-gray-400",
                  )}
                />
                <span className="text-xs text-gray-500 capitalize">
                  {thread.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function AgentChatIntro(props: { deploymentId: string }) {
  const { session } = useAuthContext();

  const recent = useSWR(
    { kind: "recent", deploymentId: props.deploymentId, session },
    async ({ deploymentId, session }) => {
      if (!deploymentId || !session?.accessToken) return [];
      const client = createClient(deploymentId, session.accessToken);
      return await client.threads.search({
        limit: 5,
        sortBy: "updated_at",
        sortOrder: "desc",
      });
    },
  );

  const interrupted = useSWR(
    { kind: "interrupted", deploymentId: props.deploymentId, session },
    async ({ deploymentId, session }) => {
      if (!deploymentId || !session?.accessToken) return [];
      const client = createClient(deploymentId, session.accessToken);
      return await client.threads.search({
        limit: 5,
        status: "interrupted",
        sortBy: "updated_at",
        sortOrder: "desc",
      });
    },
  );
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
    <div className="mx-4 flex flex-col items-stretch gap-8">
      <div className="flex flex-col">
        <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase">
          Requiring Attention
        </h2>
        <div className="space-y-2">
          {interrupted.data?.map((thread) => (
            <AgentChatItem
              key={thread.thread_id}
              thread={thread}
              interrupted
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase">
          Recent Threads
        </h2>
        <div className="space-y-2">
          {recent.data.map((thread) => (
            <AgentChatItem
              key={thread.thread_id}
              thread={thread}
            />
          ))}
        </div>
      </div>
    </div>
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
  const { agents } = useAgentsContext();

  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [threadId, setCurrentThreadId] = useQueryState("threadId");
  const [_draft, setDraft] = useQueryState("draft");
  const [fullChat, setFullChat] = useQueryState("fullChat");

  const deployments = getDeployments();
  const selectedDeployment = useMemo(
    () => deployments.find((d) => d.id === deploymentId),
    [deployments, deploymentId],
  );

  const selectedAgent = useMemo(
    () => agents.find((a) => a.assistant_id === agentId) || null,
    [agents, agentId],
  );

  // Guard missing essentials
  if (!deploymentId || !session?.accessToken) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-sm">
        Select an agent and a thread to view chat
      </div>
    );
  }

  const isEmpty = !threadId;

  return (
    <div className="absolute inset-0 grid grid-rows-[auto_1fr]">
      <div className="grid min-w-0 grid-cols-[1fr_auto] items-center border-b p-4">
        <span className="flex flex-col gap-1 truncate text-lg font-semibold text-gray-800">
          {selectedAgent?.name || "Agent"}
        </span>

        <div className="flex items-center gap-2">
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

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!agentId) {
                toast.info("Please select an agent", { richColors: true });
                return;
              }
              await setCurrentThreadId(null);
              await setDraft("1");
            }}
            className="shadow-icon-button rounded-md border border-[#2F6868] bg-[#2F6868] p-3 text-white hover:bg-[#2F6868] hover:text-gray-50"
            disabled={!agentId}
          >
            <SquarePen className="size-5" />
            <span>New Conversation</span>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[1024px] flex-1 flex-col">
        <DeepAgentChatInterface
          key={`chat-${deploymentId}`}
          assistantId={agentId || ""}
          deploymentUrl={selectedDeployment?.deploymentUrl || ""}
          accessToken={session.accessToken || ""}
          optimizerDeploymentUrl={selectedDeployment?.deploymentUrl || ""}
          optimizerAccessToken={session.accessToken || ""}
          mode="oap"
          SidebarTrigger={SidebarTrigger}
          DeepAgentChatBreadcrumb={DeepAgentChatBreadcrumb}
          hideInternalToggle={true}
          empty={
            isEmpty ? <AgentChatIntro deploymentId={deploymentId} /> : null
          }
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
                await setDraft(null);
              }}
            >
              <SelectTrigger>{selectedAgent?.name || "Agent"}</SelectTrigger>
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
          }
        />
      </div>
    </div>
  );
}
