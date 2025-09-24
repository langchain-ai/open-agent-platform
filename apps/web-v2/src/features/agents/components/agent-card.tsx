"use client";

import {
  Bot,
  Cloud,
  Edit,
  MessageSquare,
  User,
  Webhook,
  Wrench,
  LoaderCircle,
  Trash2,
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
import {
  isUserCreatedDefaultAssistant,
  detectSupportedConfigs,
} from "@/lib/agent-utils";
import { useAgents } from "@/hooks/use-agents";
import { useTriggers } from "@/hooks/use-triggers";
import { useAuthContext } from "@/providers/Auth";
import { useAgentsContext } from "@/providers/Agents";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useMemo } from "react";

function SupportedConfigBadge({
  type,
}: {
  type: "tools" | "triggers" | "subagents";
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {type === "tools" && (
            <Badge variant="secondary">
              <Wrench />
              Tools
            </Badge>
          )}
          {type === "triggers" && (
            <Badge variant="secondary">
              <Webhook />
              Triggers
            </Badge>
          )}
          {type === "subagents" && (
            <Badge variant="brand">
              <User />
              Sub-agents
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
  agentIdsWithTriggers?: Set<string>;
}

export function AgentCard({
  agent,
  showDeployment,
  agentIdsWithTriggers,
}: AgentCardProps) {
  // Enhance supportedConfigs with trigger information
  const agentWitihConfigs = useMemo(
    () => ({
      ...agent,
      supportedConfigs: detectSupportedConfigs(agent, agentIdsWithTriggers),
    }),
    [agent, agentIdsWithTriggers],
  );
  const deployments = getDeployments();
  const selectedDeployment = deployments.find(
    (d) => d.id === agent.deploymentId,
  );

  const isDefaultAgent = isUserCreatedDefaultAssistant(agent);
  const hasConfigurable = Boolean(agent.config?.configurable);

  const { deleteAgent } = useAgents();
  const { listAgentTriggers, updateAgentTriggers } = useTriggers();
  const { session } = useAuthContext();
  const { refreshAgents } = useAgentsContext();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

  const handleDelete = async () => {
    if (!session?.accessToken) {
      toast.error("No access token found", { richColors: true });
      return;
    }
    if (!agent) {
      toast.error("No agent found", { richColors: true });
      return;
    }

    setDeleteSubmitting(true);
    const deleted = await deleteAgent(agent.deploymentId, agent.assistant_id);
    setDeleteSubmitting(false);

    if (!deleted) {
      toast.error("Failed to delete agent", {
        description: "Please try again",
        richColors: true,
      });
      return;
    }

    const currentTriggerIds = await listAgentTriggers(
      session.accessToken,
      agent.assistant_id,
    );

    if (currentTriggerIds.length > 0) {
      const success = await updateAgentTriggers(session.accessToken, {
        agentId: agent.assistant_id,
        selectedTriggerIds: [],
        currentTriggerIds: currentTriggerIds,
      });
      if (!success) {
        toast.error("Failed to update agent triggers", {
          richColors: true,
        });
        return;
      }
    }

    toast.success("Agent deleted successfully!", { richColors: true });
    await refreshAgents();
    setDeleteOpen(false);
  };

  return (
    <Card
      key={agent.assistant_id}
      className="overflow-hidden min-w-80"
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
          {agentWitihConfigs.supportedConfigs?.map((config) => (
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

      <CardFooter className="mt-auto flex w-full items-center gap-2 pt-2">
        {!isDefaultAgent && (
          <>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <NextLink
                href={`/editor?agentId=${agent.assistant_id}&deploymentId=${agent.deploymentId}`}
              >
                <Edit className="mr-2 h-3.5 w-3.5" />
                Edit
              </NextLink>
            </Button>
            <AlertDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                >
                  {deleteSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete agent “{agent.name}”?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. It will permanently delete the
                    agent and unlink any attached triggers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteSubmitting}
                    >
                      {deleteSubmitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        <div className="ml-auto">
          <NextLink
            href={`/agents/chat?agentId=${agent.assistant_id}&deploymentId=${agent.deploymentId}&draft=1&fullChat=1`}
          >
            <Button size="sm">
              <MessageSquare className="mr-2 h-3.5 w-3.5" />
              Chat
            </Button>
          </NextLink>
        </div>
      </CardFooter>
    </Card>
  );
}
