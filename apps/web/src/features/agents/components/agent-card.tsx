"use client";

import { useState } from "react";
import {
  Bot,
  Brain,
  BrainCircuit,
  Cloud,
  Edit,
  MessageSquare,
  User,
  Webhook,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Agent } from "@/types/agent";
import { EditAgentDialog } from "./create-edit-agent-dialogs/edit-agent-dialog";
import { AgentGraphVisualization } from "@/features/agent-graph-visualization";
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
  type: "rag" | "tools" | "supervisor" | "deep_agent" | "triggers";
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {type === "rag" && (
            <Badge variant="brand">
              <Brain />
              RAG
            </Badge>
          )}
          {type === "tools" && (
            <Badge variant="info">
              <Wrench />
              MCP Tools
            </Badge>
          )}
          {type === "supervisor" && (
            <Badge variant="brand">
              <User />
              Supervisor
            </Badge>
          )}
          {type === "deep_agent" && (
            <Badge variant="secondary">
              <BrainCircuit />
              Deep Agent
            </Badge>
          )}
          {type === "triggers" && (
            <Badge variant="secondary">
              <Webhook />
              Triggers
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
  const hasConfigurable = Boolean(agent.config?.configurable);

  return (
    <>
      <Card
        key={agent.assistant_id}
        className="overflow-hidden"
      >
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="flex w-full flex-wrap items-center gap-2">
              <p>{agent.name}</p>
              {showDeployment && selectedDeployment && (
                <div className="flex flex-wrap items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline">
                          <Cloud />
                          {selectedDeployment.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        The deployment the graph & agent belongs to.
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline">
                          <Bot />
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
          <div className="flex flex-0 flex-wrap items-center justify-start gap-2">
            {agent.metadata?.description &&
            typeof agent.metadata.description === "string" ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {agent.metadata.description}
              </p>
            ) : null}
            {agent.supportedConfigs?.map((config) => (
              <SupportedConfigBadge
                key={`${agent.assistant_id}-${config}`}
                type={config}
              />
            ))}
          </div>
        </CardHeader>

        {hasConfigurable && (
          <CardContent className="pt-0 pb-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Bot className="mr-2 h-4 w-4" />
                  View Graph
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full min-w-[80vw]">
                <DialogHeader>
                  <DialogTitle>Agent Graph: {agent.name}</DialogTitle>
                </DialogHeader>
                <AgentGraphVisualization
                  configurable={agent.config?.configurable || {}}
                  name={agent.name}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        )}

        <CardFooter className="mt-auto flex w-full justify-between pt-2">
          {!isDefaultAgent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          <NextLink
            href={`/chat?agentId=${agent.assistant_id}&deploymentId=${agent.deploymentId}`}
            className="ml-auto"
          >
            <Button size="sm">
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
