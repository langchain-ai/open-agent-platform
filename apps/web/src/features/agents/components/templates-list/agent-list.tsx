"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateAgentDialog } from "../create-edit-agent-dialogs/create-agent-dialog";
import { Agent } from "@/types/agent";
import { isUserCreatedDefaultAssistant } from "@/lib/agent-utils";
import _ from "lodash";
import { AgentCard } from "../agent-card";

interface AgentListProps {
  agents: Agent[];
  deploymentId: string;
}

export function AgentList({ agents, deploymentId }: AgentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const defaultAgent = agents.find(isUserCreatedDefaultAssistant) ?? agents[0];
  const graphId = defaultAgent.graph_id;
  // Agent ID in this context is the default assistant ID since it's used
  // to fetch the config schema for a specific graph
  const agentId = defaultAgent.assistant_id;

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search agents..."
            className="bg-background/50 border-border/50 focus:bg-background pl-10 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Agent
        </Button>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="border-border/50 from-muted/20 to-muted/5 flex flex-col items-center justify-center rounded-xl border border-dashed bg-gradient-to-br p-8 text-center">
          <h3 className="text-foreground text-lg font-medium">
            No agents found
          </h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Create a new agent or try a different search.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-accent/50 mt-4 transition-colors"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={`agent-list-${agent.assistant_id}`}
              agent={agent}
            />
          ))}
        </div>
      )}

      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        graphId={graphId}
        agentId={agentId}
        deploymentId={deploymentId}
      />
    </div>
  );
}
