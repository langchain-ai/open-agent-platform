import { SubAgent } from "@/types/sub-agent";
import { Users } from "lucide-react";
import { AddEditSubAgentDialog } from "./add-edit-sub-agent-dialog";
import { SubAgentCard } from "./sub-agent-card";

export function SubAgentCreator(props: {
  subAgents: SubAgent[];
  onSubAgentChange: (subAgents: SubAgent[]) => void;
}) {
  const handleAddSubAgent = (subAgent: SubAgent) => {
    props.onSubAgentChange([...props.subAgents, subAgent]);
  };

  const handleEditSubAgent = (
    updatedSubAgent: SubAgent,
    originalSubAgent: SubAgent,
  ) => {
    const updatedSubAgents = props.subAgents.map((agent) =>
      agent === originalSubAgent ? updatedSubAgent : agent,
    );
    props.onSubAgentChange(updatedSubAgents);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <div className="mb-6">
          <h2 className="text-md font- mb-2">Sub-agents</h2>
          <p className="text-muted-foreground">
            Set up sub-agents for your agent
          </p>
        </div>

        <AddEditSubAgentDialog onSubmit={handleAddSubAgent} />
      </div>

      <div className="space-y-4">
        {props.subAgents?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-gray-900">
              No sub-agents yet
            </h3>
            <p className="mb-4 max-w-sm text-sm text-gray-500">
              Sub-agents help break down complex tasks. Add your first sub-agent
              to get started.
            </p>
            <AddEditSubAgentDialog onSubmit={handleAddSubAgent} />
          </div>
        )}
        {props.subAgents.map((subAgent, index) => {
          return (
            <SubAgentCard
              key={`${subAgent.name}-${index}`}
              subAgent={subAgent}
              handleEditSubAgent={handleEditSubAgent}
            />
          );
        })}
      </div>
    </div>
  );
}
