"use client";

import { useState } from "react";
import {
  Bot,
  Brain,
  Cloud,
  Edit,
  MessageSquare,
  User,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent } from "@/types/agent";
import { EditAgentDialog } from "./create-edit-agent-dialogs/edit-agent-dialog";
import _ from "lodash";
import NextLink from "next/link";
import { Badge } from "@/components/ui/badge";
import { getDeployments } from "@/lib/environment/deployments";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isUserCreatedDefaultAssistant } from "@/lib/agent-utils";

function SupportedConfigBadge({
  type,
}: {
  type: "rag" | "tools" | "supervisor";
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {type === "rag" && (
            <Badge
              variant="brand"
              className="border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <Brain className="h-3 w-3" />
              RAG
            </Badge>
          )}
          {type === "tools" && (
            <Badge
              variant="info"
              className="border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
            >
              <Wrench className="h-3 w-3" />
              MCP Tools
            </Badge>
          )}
          {type === "supervisor" && (
            <Badge
              variant="brand"
              className="border-purple-200 bg-purple-50 text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300"
            >
              <User className="h-3 w-3" />
              Supervisor
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>This agent supports {type}.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AgentCardProps {
  agent: Agent;
  showDeployment?: boolean;
}

export function AgentCard({ agent, showDeployment }: AgentCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const deployments = getDeployments();
  const selectedDeployment = deployments.find(
    (d) => d.id === agent.deploymentId,
  );

  const isDefaultAgent = isUserCreatedDefaultAssistant(agent);

  return (
    <>
      <Card
        key={agent.assistant_id}
        className="group from-card to-card/50 overflow-hidden border-0 bg-gradient-to-br backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
      >
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="flex w-full flex-wrap items-center gap-2">
              <h3 className="text-foreground group-hover:text-primary text-lg font-semibold transition-colors">
                {agent.name}
              </h3>
              {showDeployment && selectedDeployment && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="outline"
                          className="bg-muted/50 border-muted-foreground/20 text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          <Cloud className="h-3 w-3" />
                          {selectedDeployment.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        The deployment the graph & agent belongs to.
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="outline"
                          className="bg-muted/50 border-muted-foreground/20 text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          <Bot className="h-3 w-3" />
                          {agent.graph_id}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        The graph the agent belongs to.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardTitle>
          </div>
          <div className="flex flex-col gap-3">
            {agent.metadata?.description &&
            typeof agent.metadata.description === "string" ? (
              <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                {agent.metadata.description}
              </p>
            ) : null}
            {agent.supportedConfigs && agent.supportedConfigs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {agent.supportedConfigs.map((config) => (
                  <SupportedConfigBadge
                    key={`${agent.assistant_id}-${config}`}
                    type={config}
                  />
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardFooter className="border-border/50 mt-auto flex w-full justify-between border-t pt-3">
          {!isDefaultAgent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="hover:bg-accent/50 transition-colors"
            >
              <Edit className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          <NextLink
            href={`/?agentId=${agent.assistant_id}&deploymentId=${agent.deploymentId}`}
            className="ml-auto"
          >
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <MessageSquare className="mr-2 h-3.5 w-3.5" />
              Chat
            </Button>
          </NextLink>
        </CardFooter>
      </Card>
      <EditAgentDialog
        agent={agent}
        open={showEditDialog}
        onOpenChange={(c) => setShowEditDialog(c)}
      />
    </>
  );
}
