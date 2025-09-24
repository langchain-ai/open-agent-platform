import { SubAgent } from "@/types/sub-agent";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { AddEditSubAgentDialog } from "./add-edit-sub-agent-dialog";

export function SubAgentCard(props: {
  subAgent: SubAgent;
  handleEditSubAgent: (subAgent: SubAgent, originalSubAgent: SubAgent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { subAgent, handleEditSubAgent } = props;

  return (
    <div className="cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        className="p-4"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex w-full items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-sm font-semibold text-gray-900">
              {subAgent.name}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {subAgent.description}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0 items-center gap-2">
            <AddEditSubAgentDialog
              subAgent={subAgent}
              onSubmit={(updatedSubAgent) =>
                handleEditSubAgent(updatedSubAgent, subAgent)
              }
              isEditing={true}
            />
            {expanded ? (
              <ChevronUp className="size-4 text-gray-400" />
            ) : (
              <ChevronDown className="size-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">Prompt</h4>
              <p className="rounded border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-700">
                {subAgent.prompt}
              </p>
            </div>

            {subAgent.tools && subAgent.tools.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-900">
                  Tools ({subAgent.tools.length})
                </h4>
                <div className="rounded border border-gray-200 bg-white p-3">
                  <ul className="space-y-1">
                    {subAgent.tools.map((tool, index) => (
                      <li
                        key={index}
                        className="flex items-center text-sm text-gray-700"
                      >
                        <span className="mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
