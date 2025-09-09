"use client";

import React from "react";
import VideoBackgroundPageWrapper from "@/components/VideoBackgroundPageWrapper";
import DescribeAgentStep from "./DescribeAgentStep";
import ConnectServicesStep from "./ConnectServicesStep";
import ToolsSelectionStep from "./ToolsSelectionStep";
import ReadyStep from "./ReadyStep";

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
    "describe" | "connect" | "tools" | "ready"
  >("describe");
  const [agentName, setAgentName] = React.useState("");
  const [agentDescription, setAgentDescription] = React.useState("");
  const close = () => {
    setOpen(false);
    onClose?.();
  };

  if (!open) return null;

  // Render a plain white background for the final ready page
  if (step === "ready") {
    return (
      <div className="min-h-screen w-full bg-white">
        <ReadyStep onOpenWorkspace={close} />
      </div>
    );
  }

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
            onContinue={() => setStep("ready")}
            onBack={() => setStep("connect")}
            onCreate={() => setStep("ready")}
          />
        ) : null}
      </div>
    </VideoBackgroundPageWrapper>
  );
}

export default OnboardingDialog;
