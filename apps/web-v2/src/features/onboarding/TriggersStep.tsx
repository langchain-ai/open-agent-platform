"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TriggersInterface from "@/features/triggers";
import { OAPLogoBlue } from "@/components/icons/oap-logo-blue";

type TriggersStepProps = {
  onSkip: () => void;
  onContinue: () => void;
  onBack: () => void;
};

export default function TriggersStep({
  onSkip,
  onContinue,
  onBack,
}: TriggersStepProps) {
  return (
    <div className="grid h-screen grid-cols-2 overflow-y-hidden">
      <div
        className={cn(
          "z-10",
          "flex h-full w-[50%] min-w-[776px] flex-col items-start justify-start rounded-r-[83px] bg-white p-[72px] text-black",
          "shadow-[0_675px_189px_0_rgba(138,118,158,0.00),0_432px_173px_0_rgba(138,118,158,0.01),0_243px_146px_0_rgba(138,118,158,0.05),0_108px_108px_0_rgba(138,118,158,0.09),0_27px_59px_0_rgba(138,118,158,0.10)]",
        )}
      >
        <div className="shrink-0">
          <OAPLogoBlue
            width={146}
            height={38}
          />
        </div>

        <button
          type="button"
          className="mt-6 mb-6 -ml-2 flex items-center gap-2 text-lg text-[#0A5982]"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1 className="text-start text-[48px] leading-[120%] font-normal tracking-[-1.2px] text-[var(--colors-text-text-primary-900,#101828)]">
          Triggers
        </h1>
        <p className="mt-2 max-w-[640px] text-[16px] leading-[20px] tracking-[-0.2px] text-[#3F3F46]">
          Set up triggers to automatically activate your agents
        </p>

        <div className="mt-6 w-full max-w-[640px] flex-1 overflow-y-auto">
          <div className="-m-4 md:-m-8">
            <TriggersInterface hideHeader={true} />
          </div>
        </div>

        <div className="mt-auto flex w-full items-center justify-between">
          <button
            type="button"
            className="text-brand-primary flex items-center gap-2 border-b border-[var(--brand-primary)]"
            onClick={onSkip}
          >
            Skip
          </button>
          <Button
            type="button"
            className="h-[56px] rounded-full bg-[#0A5982] px-6 text-white hover:bg-[#0A5982]/90"
            onClick={onContinue}
          >
            Create Agent
          </Button>
        </div>
      </div>
    </div>
  );
}
