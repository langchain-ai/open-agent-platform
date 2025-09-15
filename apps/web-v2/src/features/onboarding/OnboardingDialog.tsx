"use client";

import React from "react";
import { useRouter } from "next/navigation";
import VideoBackgroundPageWrapper from "@/components/VideoBackgroundPageWrapper";
import DescribeAgentStep from "./DescribeAgentStep";
import ConnectServicesStep from "./ConnectServicesStep";
import ToolsSelectionStep from "./ToolsSelectionStep";
import TriggersStep from "./TriggersStep";
import ReadyStep from "./ReadyStep";
import { getDeployments } from "@/lib/environment/deployments";
import { useAgents } from "@/hooks/use-agents";
import Loading from "@/components/ui/loading";

type OnboardingDialogProps = {
  initialOpen?: boolean;
  onClose?: () => void;
};

export function OnboardingDialog({
  initialOpen = true,
  onClose,
}: OnboardingDialogProps) {
  const [open, setOpen] = React.useState<boolean>(initialOpen);
  const [step, setStep] = React.useState<
    "describe" | "connect" | "tools" | "triggers" | "ready"
  >("describe");
  const [agentName, setAgentName] = React.useState("");
  const [agentDescription, setAgentDescription] = React.useState("");
  const [selectedTools, setSelectedTools] = React.useState<string[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdAgentId, setCreatedAgentId] = React.useState<string | null>(
    null,
  );
  const router = useRouter();
  const deployments = getDeployments();
  const defaultDeployment = deployments.find((d) => d.isDefault);
  const defaultGraphId = defaultDeployment?.graphs.find((g) => g.isDefault)?.id;
  const { createAgent } = useAgents();
  const close = () => {
    setOpen(false);
    onClose?.();
  };

  if (!open) return null;

  // Render a plain white background for the final ready page
  if (step === "ready") {
    return (
      <div className="min-h-screen w-full bg-white">
        <ReadyStep
          onOpenWorkspace={() => {
            if (createdAgentId && defaultDeployment?.id) {
              router.push(
                `/chat?agentId=${createdAgentId}&deploymentId=${defaultDeployment.id}`,
              );
            } else {
              router.push("/chat");
            }
          }}
        />
      </div>
    );
  }

  // Global creating state
  if (isCreating) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Loading label="Creating your workspace" />
      </div>
    );
  }

  const handleCreateAgent = async () => {
    if (!defaultDeployment?.id || !defaultGraphId) {
      // If env isn't configured, just proceed to ready to avoid blocking UX
      setStep("ready");
      return;
    }
    setIsCreating(true);
    try {
      const agent = await createAgent(defaultDeployment.id, defaultGraphId, {
        name: agentName || "My Agent",
        description: agentDescription || "",
        config: {
          instructions: agentDescription || "",
          subagents: [],
          tools: { tools: selectedTools },
          triggers: [],
        },
      });
      if (agent?.assistant_id) {
        setCreatedAgentId(agent.assistant_id);
      }
    } finally {
      setIsCreating(false);
      setStep("ready");
    }
  };

  return (
    <VideoBackgroundPageWrapper className="relative h-screen overflow-hidden">
      <div className="absolute top-0 left-0 w-full">
        {step === "describe" ? (
          <DescribeAgentStep
            onSkip={close}
            onContinue={() => setStep("connect")}
            name={agentName}
            description={agentDescription}
            setName={setAgentName}
            setDescription={setAgentDescription}
          />
        ) : step === "connect" ? (
          <ConnectServicesStep
            onSkip={close}
            onContinue={() => setStep("tools")}
            onBack={() => setStep("describe")}
          />
        ) : step === "tools" ? (
          <ToolsSelectionStep
            onSkip={close}
            onContinue={() => setStep("triggers")}
            onBack={() => setStep("connect")}
            onCreate={(selected) => {
              setSelectedTools(selected);
              setStep("triggers");
            }}
          />
        ) : step === "triggers" ? (
          <TriggersStep
            onSkip={close}
            onContinue={handleCreateAgent}
            onBack={() => setStep("tools")}
          />
        ) : null}
      </div>
    </VideoBackgroundPageWrapper>
  );
}

export default OnboardingDialog;
