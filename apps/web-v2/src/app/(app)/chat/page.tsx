"use client";

import React, { useState, useMemo } from "react";
import { AgentsProvider, useAgentsContext } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import DeepAgentChatPageContent from "@/features/chat";
import { PageHeader } from "@/features/chat/components";
import { Toaster } from "@/components/ui/sonner";
import { useQueryState } from "nuqs";

function DeepAgentChatPageInner(): React.ReactNode {
  const [view, setView] = useState<"chat" | "workflow">("chat");
  const [agentId] = useQueryState("agentId");
  const { agents } = useAgentsContext();

  const selectedAgent = useMemo(() => {
    return agents.find((agent) => agent.assistant_id === agentId);
  }, [agents, agentId]);

  return (
    <>
      <PageHeader
        view={view}
        setView={setView}
        assistantName={selectedAgent?.name}
        showToggle={!!agentId}
        selectedAgent={selectedAgent}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden -mt-3">
        <DeepAgentChatPageContent
          view={view}
          onViewChange={setView}
          hideInternalToggle={true}
        />
      </div>
    </>
  );
}

/**
 * Deep Agent Chat page (/chat).
 * Contains the deep agent chat interface.
 */
export default function DeepAgentChatPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading chat...</div>}>
      <div className="flex h-screen flex-col">
        <AgentsProvider>
          <MCPProvider>
            <DeepAgentChatPageInner />
          </MCPProvider>
        </AgentsProvider>
        <Toaster />
      </div>
    </React.Suspense>
  );
}
