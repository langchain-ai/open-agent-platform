import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Agent } from "@/types/agent";
import {
  groupAgentsByGraphs,
  isUserCreatedDefaultAssistant,
} from "@/lib/agent-utils";
import _ from "lodash";
import { getDeployments } from "@/lib/environment/deployments";
import { Deployment } from "@/types/deployment";
import { cn } from "@/lib/utils";

interface GraphSelectProps {
  selectedGraph: Agent | undefined;
  setSelectedGraph: (graph: Agent | undefined) => void;
  selectedDeployment: Deployment | undefined;
  setSelectedDeployment: (deployment: Deployment | undefined) => void;
  agents: Agent[];
  className?: string;
}

export function GraphSelect({
  selectedGraph,
  setSelectedGraph,
  selectedDeployment,
  setSelectedDeployment,
  agents,
  className,
}: GraphSelectProps) {
  const deployments = getDeployments();
  const graphs = deployments.flatMap((deployment) => {
    const deploymentAgents = agents.filter(
      (agent) => agent.deploymentId === deployment.id,
    );
    // Group filtered agents by graph (still needed for sorting/grouping logic)
    const agentsGroupedByGraphs = groupAgentsByGraphs(deploymentAgents);
    return agentsGroupedByGraphs.flatMap(
      (group) => group.find((g) => isUserCreatedDefaultAssistant(g)) ?? [],
    );
  });

  const getDeploymentSpan = (deploymentId: string) => {
    const deployment = deployments.find((d) => d.id === deploymentId);
    if (!deployment) return null;
    return <span className="text-muted-foreground">[{deployment.name}]</span>;
  };

  return (
    <Select
      value={
        selectedGraph && selectedDeployment
          ? `${selectedDeployment.id}:${selectedGraph.graph_id}`
          : ""
      }
      onValueChange={(v) => {
        if (!v) {
          setSelectedGraph(undefined);
          setSelectedDeployment(undefined);
          return;
        }
        const [deploymentId, graphId] = v.split(":");
        const graph = agents.find(
          (g) => g.graph_id === graphId && g.deploymentId === deploymentId,
        );
        if (!graph) return;
        setSelectedGraph(graph);
        setSelectedDeployment(deployments.find((d) => d.id === deploymentId));
      }}
    >
      <SelectTrigger className={cn(className)}>
        <SelectValue placeholder="Select a graph" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {graphs.map((graph) => (
            <SelectItem
              className="flex items-center gap-1"
              key={`${graph.deploymentId}:${graph.graph_id}`}
              value={`${graph.deploymentId}:${graph.graph_id}`}
            >
              {getDeploymentSpan(graph.deploymentId)}{" "}
              {_.startCase(graph.graph_id)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
