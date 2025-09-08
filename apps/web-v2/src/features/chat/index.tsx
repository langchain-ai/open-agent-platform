"use client";

import React, { useMemo, useState } from "react";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { useAuthContext } from "@/providers/Auth";
import { getDeployments } from "@/lib/environment/deployments";
import { useAgentsContext } from "@/providers/Agents";
import { useQueryState } from "nuqs";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DeepAgentChatBreadcrumb } from "@/features/chat/components/breadcrumb";

/**
 * Deep Agent Chat page content that uses nuqs hooks.
 */
export default function DeepAgentChatPageContent(): React.ReactNode {
  const { session } = useAuthContext();

  const { agents, loading } = useAgentsContext();
  const deployments = getDeployments();

  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const handleValueChange = (v: string) => {
    setValue(v);
    setOpen(false);
  };

  const handleStartChat = () => {
    if (!value) {
      toast.info("Please select an agent");
      return;
    }
    const [agentId_, deploymentId_] = value.split(":");
    setAgentId(agentId_);
    setDeploymentId(deploymentId_);
  };

  const selectedDeployment = useMemo(
    () => deployments.find((d) => d.id === deploymentId),
    [deploymentId],
  );

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex min-h-64 max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Deep Agent Chat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to the Deep Agent chat! To continue, please select an
              agent to chat with.
            </p>
          </div>
          <div className="mb-24 grid grid-cols-[1fr_auto] gap-4 px-6 pt-4">
            <AgentsCombobox
              placeholder="Select a deep agent..."
              disableDeselect
              agents={agents}
              agentsLoading={loading}
              value={value}
              setValue={(v) =>
                Array.isArray(v)
                  ? handleValueChange(v[0])
                  : handleValueChange(v)
              }
              open={open}
              setOpen={setOpen}
            />
            <Button onClick={handleStartChat}>Start Chat</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
      <DeepAgentChatInterface
        assistantId={agentId}
        deploymentUrl={selectedDeployment?.deploymentUrl || ""}
        accessToken={session.accessToken || ""}
        optimizerDeploymentUrl={
          process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || ""
        }
        optimizerAccessToken={session.accessToken || ""}
        mode="oap"
        SidebarTrigger={SidebarTrigger}
        DeepAgentChatBreadcrumb={DeepAgentChatBreadcrumb}
      />
  );
}
