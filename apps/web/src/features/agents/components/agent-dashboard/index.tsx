"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react"; // Added useCallback
import { Filter, Search, PlusCircle } from "lucide-react"; // Added PlusCircle
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentCard } from "../agent-card"; // This is for LangGraph Agents
import { CreateAgentDialog } from "../create-edit-agent-dialogs/create-agent-dialog"; // For LangGraph Agents

// ADK Agent Imports
import { AdkAgentStoredData } from "@/types/adk-agent";
import { RegisterAdkAgentDialog } from "../create-edit-agent-dialogs/register-adk-agent-dialog";
import { AdkAgentCard } from "../adk-agent-card"; // Display component for ADK Agents
import { useToast } from "@/components/ui/use-toast";


import { useAgentsContext } from "@/providers/Agents";
import { getDeployments } from "@/lib/environment/deployments";
import { GraphGroup } from "../../types";
import { groupAgentsByGraphs } from "@/lib/agent-utils";
import _ from "lodash";


export function AgentDashboard() {
  const { agents, loading: langGraphAgentsLoading } = useAgentsContext(); // Renamed loading for clarity
  const deployments = getDeployments();
  const [searchQuery, setSearchQuery] = useState("");
  const [graphFilter, setGraphFilter] = useState<string>("all"); // This filter is for LangGraph agents
  const [showCreateLangGraphDialog, setShowCreateLangGraphDialog] = useState(false);

  // State for ADK Agents
  const [adkAgents, setAdkAgents] = useState<AdkAgentStoredData[]>([]);
  const [adkAgentsLoading, setAdkAgentsLoading] = useState(true);
  const [showRegisterAdkDialog, setShowRegisterAdkDialog] = useState(false);
  const [editingAdkAgent, setEditingAdkAgent] = useState<AdkAgentStoredData | null>(null);
  // TODO: Add state for showing EditAdkAgentDialog, e.g., const [showEditAdkDialog, setShowEditAdkDialog] = useState(false);

  const { toast } = useToast();

  const fetchAdkAgents = useCallback(async () => {
    setAdkAgentsLoading(true);
    try {
      const response = await fetch('/api/adk-agents');
      if (!response.ok) {
        throw new Error(`Failed to fetch ADK agents: ${response.statusText}`);
      }
      const data = await response.json();
      setAdkAgents(data.agents || []);
    } catch (error) {
      console.error("Error fetching ADK agents:", error);
      toast({ title: "Error", description: "Could not fetch ADK agents.", variant: "destructive" });
      setAdkAgents([]); // Set to empty array on error
    } finally {
      setAdkAgentsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdkAgents();
  }, [fetchAdkAgents]);

  const handleAdkAgentRegistered = useCallback((newAgent: AdkAgentStoredData) => {
    // Option 1: Add to local state directly (if API returns the created object)
    // setAdkAgents(prev => [...prev, newAgent]);
    // Option 2: Re-fetch the list
    fetchAdkAgents();
    toast({ title: "Success", description: `ADK Agent "${newAgent.name}" registered.` });
  }, [fetchAdkAgents, toast]);

  const handleDeleteAdkAgent = useCallback(async (agentId: string, agentName?: string) => {
    if (!window.confirm(`Are you sure you want to delete ADK agent "${agentName || agentId}"?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/adk-agents/${agentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete ADK agent" }));
        throw new Error(errorData.error || `Failed to delete ADK agent: ${response.statusText}`);
      }
      setAdkAgents(prev => prev.filter(a => a.id !== agentId));
      toast({ title: "Success", description: `ADK Agent "${agentName || agentId}" deleted.` });
    } catch (error: any) {
      console.error("Error deleting ADK agent:", error);
      toast({ title: "Error", description: error.message || "Could not delete ADK agent.", variant: "destructive" });
    }
  }, [toast]);

  const handleEditAdkAgent = useCallback((agent: AdkAgentStoredData) => {
    console.log("Attempting to edit ADK agent (placeholder):", agent);
    setEditingAdkAgent(agent);
    // TODO: setShowEditAdkDialog(true);
    toast({ title: "Edit Action", description: `Edit for "${agent.name}" clicked. Full dialog not yet implemented.`});
  }, [toast]);


  // This is for LangGraph agents
  const allGraphGroups: GraphGroup[] = useMemo(() => {
    if (langGraphAgentsLoading) return [];
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

  const filteredAgents = useMemo(() => {
    // 1. Filter groups based on the graphFilter dropdown
    let groupsMatchingGraphFilter: GraphGroup[];

    if (graphFilter === "all") {
      groupsMatchingGraphFilter = allGraphGroups;
    } else {
      // Parse the combined ID "deploymentId:graphId"
      const [selectedDeploymentId, selectedGraphId] = graphFilter.split(":");
      groupsMatchingGraphFilter = allGraphGroups.filter(
        (group) =>
          group.deployment.id === selectedDeploymentId &&
          group.graphId === selectedGraphId,
      );
    }

    // 2. Get all agents from the groups that matched the graph filter
    const agentsInFilteredGroups = groupsMatchingGraphFilter.flatMap(
      (group) => group.agents,
    );

    // 3. Filter these agents based on the search query
    const lowerCaseQuery = searchQuery.toLowerCase();
    if (!lowerCaseQuery) {
      return agentsInFilteredGroups; // No search query, return all agents from filtered groups
    }

    return agentsInFilteredGroups.filter((agent) =>
      agent.name.toLowerCase().includes(lowerCaseQuery),
    );
  }, [allGraphGroups, graphFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
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
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select
            value={graphFilter}
            onValueChange={setGraphFilter}
          >
            <SelectTrigger className="h-9 min-w-[180px]">
              <SelectValue placeholder="All Templates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              {allGraphGroups.map((graph) => (
                <SelectItem
                  key={`${graph.deployment.id}:${graph.graphId}`}
                  value={`${graph.deployment.id}:${graph.graphId}`} // Use combined ID for value
                >
                  <span className="text-muted-foreground">
                    [{graph.deployment.name}]
                  </span>
                  {_.startCase(graph.graphId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {filteredAgents.length}{" "}
          {filteredAgents.length === 1 ? "Agent" : "Agents"}
        </h2>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="animate-in fade-in-50 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-10 w-10" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No agents found</h2>
          <p className="text-muted-foreground mt-2 mb-8 text-center">
            We couldn't find any agents matching your search criteria. Try
            adjusting your filters or create a new agent.
          </p>
          <Button onClick={() => setShowCreateLangGraphDialog(true)}>
            Create LangGraph Agent
          </Button>
          <Button variant="outline" onClick={() => setShowRegisterAdkDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Register ADK Agent
          </Button>
        </div>
      ) : (
        <>
          {/* LangGraph Agents Listing */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={`langgraph-agent-${agent.assistant_id}`}
                agent={agent}
                showDeployment={true}
              />
            ))}
          </div>

          {/* ADK Agents Listing Section */}
          <div className="mt-12"> {/* Added margin-top for separation */}
            <h2 className="text-lg font-medium mb-4">
              ADK Agents ({adkAgents.length})
              {adkAgentsLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin inline-block" />}
            </h2>
            {adkAgents.length === 0 && !adkAgentsLoading ? (
              <div className="animate-in fade-in-50 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                  <Search className="text-muted-foreground h-10 w-10" />
                </div>
                <h2 className="mt-6 text-xl font-semibold">No ADK agents found</h2>
                <p className="text-muted-foreground mt-2 mb-8 text-center">
                  Register a new ADK agent to see it here.
                </p>
                <Button variant="outline" onClick={() => setShowRegisterAdkDialog(true)}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Register ADK Agent
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {adkAgents.map((adkAgent) => (
                  <AdkAgentCard
                    key={`adk-agent-${adkAgent.id}`}
                    agent={adkAgent}
                    onDelete={() => handleDeleteAdkAgent(adkAgent.id, adkAgent.name)}
                    onEdit={() => handleEditAdkAgent(adkAgent)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* TODO: Replace with EditAgentDialog */}
      <CreateAgentDialog
        open={showCreateLangGraphDialog}
        onOpenChange={setShowCreateLangGraphDialog}
      />
      <RegisterAdkAgentDialog
        open={showRegisterAdkDialog}
        onOpenChange={setShowRegisterAdkDialog}
        onSuccess={handleAdkAgentRegistered} // Changed from onRegistered to onSuccess to match dialog
      />
      {/*
      // TODO: Implement EditAdkAgentDialog
      {editingAdkAgent && (
        <EditAdkAgentDialog
          agent={editingAdkAgent}
          open={!!editingAdkAgent} // or showEditAdkDialog
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingAdkAgent(null);
            // else setShowEditAdkDialog(isOpen);
          }}
          onSuccess={() => {
            setEditingAdkAgent(null);
            // setShowEditAdkDialog(false);
            fetchAdkAgents(); // Re-fetch or update local state
            toast({ title: "Success", description: "ADK Agent updated." });
          }}
        />
      )}
      */}
    </div>
  );
}
              agent={agent}
              showDeployment={true}
            />
          ))}
        </div>
      )}

      {/* TODO: Replace with EditAgentDialog */}
      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
