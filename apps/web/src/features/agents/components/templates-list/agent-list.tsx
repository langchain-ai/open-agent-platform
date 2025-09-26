"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Agent } from "@/types/agent";
import { AgentCard } from "../agent-card";

interface AgentListProps {
  agents: Agent[];
}

export function AgentList({ agents }: AgentListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Search agents..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          asChild
        >
          <NextLink href="/editor?new=true">
            <Plus className="mr-2 h-4 w-4" />
            New Agent
          </NextLink>
        </Button>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a new agent or try a different search.
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            asChild
          >
            <NextLink href="/editor?new=true">
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </NextLink>
          </Button>
        </div>
      ) : (
        <div
          className={
            filteredAgents.length === 1
              ? "grid grid-cols-1 gap-4 md:max-w-xl md:grid-cols-2 lg:grid-cols-3"
              : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          }
        >
          {filteredAgents.map((agent) => (
            <AgentCard
              key={`agent-list-${agent.assistant_id}`}
              agent={agent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
