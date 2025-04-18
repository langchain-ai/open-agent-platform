"use client";

import { groupAgentsByGraphs, sortAgentGroup } from "@/lib/agent-utils";
import { useAgentsContext } from "@/providers/Agents";
import React from "react";
import { AgentCard } from "./components/agent-card";
import { getDeployments } from "@/lib/environment/deployments";
import { Separator } from "@/components/ui/separator";
import { CirclePlus, Computer } from "lucide-react";
import { TooltipIconButton } from "../ui/tooltip-icon-button";

const GraphSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.2284 19.467C16.5473 19.467 15.8941 19.1971 15.4125 18.7166C14.9309 18.2362 14.6603 17.5846 14.6603 16.9051C14.6603 16.2874 14.8839 15.6927 15.2864 15.2287L13.807 13.0691L14.8328 12.3663L16.3046 14.5147C16.5966 14.4024 16.9094 14.3432 17.2284 14.3432C17.9094 14.3432 18.5626 14.6132 19.0442 15.0936C19.5258 15.574 19.7964 16.2257 19.7964 16.9051C19.7964 17.5846 19.5258 18.2362 19.0442 18.7166C18.5626 19.1971 17.9094 19.467 17.2284 19.467ZM11.9639 12.0248C11.5618 12.0279 11.1645 11.9367 10.8042 11.7587C10.4439 11.5806 10.1305 11.3206 9.88928 10.9996C9.64808 10.6787 9.48581 10.3057 9.41553 9.91069C9.34526 9.51571 9.36895 9.10979 9.48469 8.72561C9.60043 8.34143 9.80499 7.98974 10.0819 7.69885C10.3588 7.40796 10.7003 7.18601 11.0789 7.05087C11.4575 6.91573 11.8627 6.87118 12.2617 6.9208C12.6608 6.97042 13.0425 7.11283 13.3763 7.33656C13.8317 7.64183 14.1771 8.08458 14.362 8.59994C14.5468 9.1153 14.5613 9.67617 14.4034 10.2004C14.2455 10.7245 13.9234 11.1845 13.4844 11.5128C13.0454 11.8411 12.5125 12.0205 11.9639 12.0248ZM11.9639 26.901C11.5618 26.9041 11.1645 26.813 10.8042 26.6349C10.4439 26.4569 10.1305 26.1969 9.88928 25.8759C9.64808 25.555 9.48581 25.182 9.41553 24.787C9.34526 24.392 9.36895 23.9861 9.48469 23.6019C9.60043 23.2177 9.80499 22.866 10.0819 22.5751C10.3588 22.2842 10.7003 22.0623 11.0789 21.9272C11.4575 21.792 11.8627 21.7475 12.2617 21.7971C12.6608 21.8467 13.0425 21.9891 13.3763 22.2128C13.8317 22.5181 14.1771 22.9609 14.362 23.4762C14.5468 23.9916 14.5613 24.5525 14.4034 25.0766C14.2455 25.6008 13.9234 26.0608 13.4844 26.3891C13.0454 26.7174 12.5125 26.8968 11.9639 26.901ZM13.1651 16.2683V17.542H9.23465C9.13578 17.9282 8.94722 18.2859 8.68412 18.5864L10.1501 20.7771L9.08741 21.4904L7.60868 19.2996C7.33768 19.3976 7.052 19.4492 6.7637 19.4525C6.08459 19.4525 5.4333 19.1841 4.9531 18.7064C4.4729 18.2287 4.20312 17.5807 4.20312 16.9051C4.20312 16.2296 4.4729 15.5816 4.9531 15.1039C5.4333 14.6262 6.08459 14.3578 6.7637 14.3578C7.052 14.3611 7.33768 14.4127 7.60868 14.5106L9.08741 12.3199L10.1629 13.0332L8.68412 15.2239C8.94722 15.5244 9.13578 15.8821 9.23465 16.2683H13.1651Z"
      fill="black"
    ></path>
  </svg>
);

/**
 * The parent component containing the agents interface.
 */
export default function AgentsInterface(): React.ReactNode {
  const { agents } = useAgentsContext();
  const agentsGroupedByGraphs = groupAgentsByGraphs(agents);
  const deployments = getDeployments();

  return (
    <div className="flex w-full flex-col gap-16 p-6">
      {deployments.map((deployment) => (
        <div
          key={deployment.id}
          className="flex w-full flex-col gap-4"
        >
          <div className="flex items-center justify-start gap-2">
            <Computer className="size-6" />
            <p className="text-lg font-semibold tracking-tight">
              {deployment.name}
            </p>
          </div>
          <Separator />
          {agentsGroupedByGraphs.map((agentGroup) => {
            const sortedAgentGroup = sortAgentGroup(agentGroup);
            return (
              <div
                key={agentGroup[0].graph_id}
                className="flex w-full flex-col gap-3"
              >
                <div className="flex items-center justify-start gap-4 text-gray-700">
                  <div className="flex items-center justify-start">
                    <GraphSVG />
                    <p className="font-medium tracking-tight">
                      {agentGroup[0].graph_id}
                    </p>
                  </div>
                  <TooltipIconButton
                    onClick={() => alert("New agent not implemented")}
                    className="size-8"
                    tooltip="New Agent"
                    delayDuration={200}
                  >
                    <CirclePlus className="size-5" />
                  </TooltipIconButton>
                </div>

                <div className="flex w-full flex-wrap gap-2">
                  {sortedAgentGroup.map((agent) => (
                    <AgentCard
                      key={agent.assistant_id}
                      agent={agent}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
