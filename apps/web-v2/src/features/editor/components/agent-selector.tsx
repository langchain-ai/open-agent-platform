import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAgentsContext } from "@/providers/Agents";
import { useQueryState } from "nuqs";
import { getDeployments } from "@/lib/environment/deployments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Edit } from "lucide-react";

export function AgentSelector(): React.ReactNode {
  const { agents } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");

  const deployments = getDeployments();

  // Default to first deployment
  useEffect(() => {
    if (!deploymentId && deployments.length > 0) {
      void setDeploymentId(deployments[0].id);
    }
  }, [deploymentId, setDeploymentId]);

  const handleAgentSelect = async (value: string) => {
    const [selectedAgentId, selectedDeploymentId] = value.split(":");
    await setAgentId(selectedAgentId);
    await setDeploymentId(selectedDeploymentId);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center space-y-6 p-6">
      <div className="flex items-center space-x-3">
        <Edit className="h-8 w-8 text-[#2F6868]" />
        <div className="space-y-1">
          <Label className="text-2xl font-semibold">
            Select an Agent to Edit
          </Label>
          <p className="text-lg text-gray-600">
            Choose an existing agent to modify its configuration, tools, and instructions.
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Label htmlFor="agent-select" className="text-base font-medium">
          Choose Agent
        </Label>

        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No agents found</p>
            <Button
              onClick={() => window.location.href = "/editor?new=true"}
              className="bg-[#2F6868] hover:bg-[#2F6868]/90"
            >
              Create Your First Agent
            </Button>
          </div>
        ) : (
          <Select onValueChange={handleAgentSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an agent to edit..." />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem
                  key={`${agent.assistant_id}:${agent.deploymentId}`}
                  value={`${agent.assistant_id}:${agent.deploymentId}`}
                >
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span>{agent.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-gray-500 mb-3">
          Want to create a new agent instead?
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/editor?new=true"}
          className="border-[#2F6868] text-[#2F6868] hover:bg-[#2F6868] hover:text-white"
        >
          Create New Agent
        </Button>
      </div>
    </div>
  );
}