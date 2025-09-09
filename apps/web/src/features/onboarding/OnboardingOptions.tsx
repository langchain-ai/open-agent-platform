"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { OnboardingCard } from "./components/OnboardingCard";

export function OnboardingOptions({
  className,
  newTenantId,
  onSkip,
}: {
  onSkip: () => void;
  newTenantId: string | undefined;
  className?: string;
}) {
  const options = [
    {
      title: "Set up Observability",
      description: "Instrument your agents to capture traces and metrics.",
      helperText: "Continue",
      onClick: onSkip,
    },
    {
      title: "Set up Evaluation",
      description: "Evaluate your agents with datasets and workflows.",
      helperText: "Continue",
      onClick: onSkip,
    },
    {
      title: "Explore Templates",
      description: "Start from ready-to-use agent templates.",
      helperText: "Open",
      onClick: onSkip,
    },
    {
      title: "Build Your Own",
      description: "Create a new agent from scratch.",
      helperText: "Create",
      onClick: onSkip,
    },
  ];

  return (
    <div
      className={cn(
        className,
        "flex h-screen w-screen flex-col items-center justify-start px-[30px] pt-[86px] pb-4 min-[1400px]:gap-[64px] sm:gap-[40px]",
      )}
    >
      {/* Logo substitute; adjust to your logo component if desired */}
      <div className="text-brand-primary shrink-0">Open Agent Platform</div>

      <div className="mt-4 flex flex-col items-center gap-10 text-start">
        <h1 className="text-start text-5xl font-normal">
          How would you like to start?
        </h1>
      </div>

      <div className="mx-auto grid grid-cols-1 gap-8 self-center overflow-x-hidden overflow-y-auto min-[1400px]:grid-cols-4 min-[1400px]:gap-6 sm:grid-cols-2 sm:gap-6">
        {options.map((option, index) => (
          <OnboardingCard
            key={index}
            {...option}
          />
        ))}
      </div>

      <div className="mx-auto">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 border-b border-[var(--brand-900)]"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default OnboardingOptions;
