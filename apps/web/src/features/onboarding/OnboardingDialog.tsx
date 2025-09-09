"use client";

import React from "react";
import VideoBackgroundPageWrapper from "@/components/VideoBackgroundPageWrapper";
import { cn } from "@/lib/utils";
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
  const [step, setStep] = React.useState<"describe" | "connect" | "tools" | "creating" | "ready">("describe");
  const [agentName, setAgentName] = React.useState("");
  const [agentDescription, setAgentDescription] = React.useState("");
  const close = () => {
    setOpen(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <VideoBackgroundPageWrapper className="relative h-screen overflow-hidden">
      <div
        className={cn("bg-primary flex h-full w-full")}
        style={{
          transitionDuration: "700ms",
          transformOrigin: "right",
          transform: "scaleX(2)",
        }}
      />
      <div className="absolute top-0 left-0 w-full">
        {step === "describe" ? (
          <DescribeAgentStep onSkip={close} onContinue={() => setStep("connect")} name={agentName} description={agentDescription} setName={setAgentName} setDescription={setAgentDescription} />
        ) : step === "connect" ? (
          <ConnectServicesStep onSkip={close} onContinue={() => setStep("tools")} onBack={() => setStep("describe")} />
        ) : step === "tools" ? (
          <ToolsSelectionStep onSkip={close} onContinue={() => setStep("creating")} onBack={() => setStep("connect")} onCreate={() => setStep("creating")} />
        ) : step === "creating" ? (
          <ReadyStep onOpenWorkspace={() => setStep("ready")} />
        ) : (
          <ReadyStep onOpenWorkspace={close} />
        )}
        
      </div>
    </VideoBackgroundPageWrapper>
  );
}

export default OnboardingDialog;
