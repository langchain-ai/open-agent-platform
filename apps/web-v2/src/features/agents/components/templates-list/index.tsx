"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateAgentDialog } from "../create-edit-agent-dialogs/create-agent-dialog";
import { TemplateCard } from "./templates-card";
import { useAgentsContext } from "@/providers/Agents";
import { getDeployments } from "@/lib/environment/deployments";
import { groupAgentsByGraphs } from "@/lib/agent-utils";
import { TemplatesLoading } from "./templates-loading";
import { GraphGroup } from "../../types";

export function TemplatesList() {
  const { agents, loading: agentsLoading } = useAgentsContext();
  const deployments = getDeployments();

  const [searchQueryState, setSearchQueryState] = useState("");
  const [openTemplatesState, setOpenTemplatesState] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const allGraphGroups: GraphGroup[] = useMemo(() => {
    if (agentsLoading) return [];
    const groups: GraphGroup[] = [];
    deployments.forEach((deployment) => {
      const agentsInDeployment = agents.filter(
        (agent) => agent.deploymentId === deployment.id,
      );
      const agentsGroupedByGraphs = groupAgentsByGraphs(agentsInDeployment);
      agentsGroupedByGraphs.forEach((agentGroup) => {
        if (agentGroup.length > 0) {
          const graphId = agentGroup[0].graph_id;
          groups.push({
            agents: agentGroup,
            deployment,
            graphId,
          });
        }
      });
    });
    return groups;
  }, [agents, deployments, agentsLoading]);

  const filteredGraphGroupsState = useMemo(() => {
    const lowerCaseQuery = searchQueryState.toLowerCase();
    return allGraphGroups.filter(
      (group) =>
        group.graphId.toLowerCase().includes(lowerCaseQuery) ||
        group.agents.some((agent) =>
          agent.name.toLowerCase().includes(lowerCaseQuery),
        ),
    );
  }, [allGraphGroups, searchQueryState]);

  const toggleGraphState = (deploymentId: string, graphId: string) => {
    const uniqueGraphKey = `${deploymentId}:${graphId}`;
    setOpenTemplatesState((prev) =>
      prev.includes(uniqueGraphKey)
        ? prev.filter((key) => key !== uniqueGraphKey)
        : [...prev, uniqueGraphKey],
    );
  };

  if (!isMounted || agentsLoading) {
    return <TemplatesLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by graph or agent name..."
            className="pl-8"
            value={searchQueryState}
            onChange={(e) => setSearchQueryState(e.target.value)}
          />
        </div>
      </div>

      {filteredGraphGroupsState.length === 0 ? (
        <div className="animate-in fade-in-50 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-10 w-10" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No graphs found</h2>
          <p className="text-muted-foreground mt-2 mb-8 text-center">
            {searchQueryState
              ? "We couldn't find any graphs matching your search."
              : "There are no agent graphs configured yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredGraphGroupsState.map(
            ({ agents: agentGroup, deployment, graphId }) => {
              const uniqueGraphKey = `${deployment.id}:${graphId}`;
              return (
                <TemplateCard
                  key={uniqueGraphKey}
                  agents={agentGroup}
                  deployment={deployment}
                  toggleGraph={() => toggleGraphState(deployment.id, graphId)}
                  isOpen={openTemplatesState.includes(uniqueGraphKey)}
                />
              );
            },
          )}
        </div>
      )}

      <CreateAgentDialog
        open={false}
        onOpenChange={() => {}}
      />
    </div>
  );
}
