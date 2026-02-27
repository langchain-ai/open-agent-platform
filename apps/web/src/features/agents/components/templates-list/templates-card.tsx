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
        "overflow-hidden transition-all duration-200",
        isOpen
          ? "border-primary/20 from-card to-card/50 bg-gradient-to-br shadow-lg shadow-black/5"
          : "from-card to-card/50 cursor-pointer border-0 bg-gradient-to-br backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5",
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
        <CardHeader className="flex flex-row items-center bg-inherit pb-4">
          <div className="flex-1">
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent/50 mr-3 h-9 w-9 p-0 transition-colors"
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
              <CardTitle className="flex items-center gap-3">
                <h2 className="text-foreground text-xl font-semibold">
                  {_.startCase(graphId)}
                </h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className="bg-muted/50 border-muted-foreground/20 text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        {deployment.name}
                      </Badge>
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
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {agentsCount} Agent{agentsCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="border-border/50 border-t pt-4">
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
