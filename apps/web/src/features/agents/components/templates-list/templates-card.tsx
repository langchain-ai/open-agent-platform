"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { AgentList } from "./agent-list";
import { cn } from "@/lib/utils";
import { Agent } from "@/types/agent";
import { Deployment } from "@/types/deployment";
import { TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@radix-ui/react-tooltip";
import _ from "lodash";

interface TemplateCardProps {
  deployment: Deployment;
  agents: Agent[];
  toggleGraph: (id: string) => void;
  isOpen: boolean;
}

export function TemplateCard({
  deployment,
  agents,
  toggleGraph,
  isOpen,
}: TemplateCardProps) {
  const graphId = agents[0].graph_id;
  const graphDeploymentId = `${deployment.id}:${graphId}`;
  const agentsCount = agents.length;
  return (
    <Card
      className={cn(
        "overflow-hidden",
        isOpen ? "" : "hover:bg-accent/50 cursor-pointer transition-colors",
      )}
      onClick={() => {
        // Don't allow toggling via clicking the card if it's already open
        if (isOpen) return;
        toggleGraph(graphDeploymentId);
      }}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={() => toggleGraph(graphDeploymentId)}
      >
        <CardHeader className="flex flex-row items-center bg-inherit">
          <div className="flex-1">
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleGraph(graphDeploymentId);
                  }}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
              <CardTitle className="flex items-center gap-2">
                <p className="text-2xl">{_.startCase(graphId)}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline">{deployment.name}</Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[350px]">
                      The deployment the graph belongs to. Deployments typically
                      contain a collection of similar, or related graphs.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {agentsCount} Agent{agentsCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-6">
            <AgentList
              agents={agents}
              deploymentId={deployment.id}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
