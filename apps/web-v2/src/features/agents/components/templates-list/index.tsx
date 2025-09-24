"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAgentsContext } from "@/providers/Agents";
import { TemplatesLoading } from "./templates-loading";
import { AgentCard } from "../agent-card";
import NextLink from "next/link";

interface TemplatesListProps {
  agentIdsWithTriggers?: Set<string>;
}

export function TemplatesList({ agentIdsWithTriggers }: TemplatesListProps) {
  const { agents, loading: agentsLoading } = useAgentsContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredAgents = useMemo(() => {
    if (agentsLoading) return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(lowerCaseQuery),
    );
  }, [agents, agentsLoading, searchQuery]);

  if (!isMounted || agentsLoading) {
    return <TemplatesLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search agents..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="animate-in fade-in-50 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-10 w-10" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No agents found</h2>
          <p className="text-muted-foreground mt-2 mb-8 text-center">
            {searchQuery
              ? "We couldn't find any agents matching your search."
              : "There are no agents configured yet."}
          </p>
          <Button
            variant="outline"
            asChild
          >
            <NextLink href="/editor">
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </NextLink>
          </Button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-4"
          style={{
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(310px, 100%), 1fr))",
          }}
        >
          {filteredAgents.map((agent) => (
            <AgentCard
              key={`agent-${agent.assistant_id}`}
              agent={agent}
              agentIdsWithTriggers={agentIdsWithTriggers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
