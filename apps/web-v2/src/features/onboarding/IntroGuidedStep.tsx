"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { OnboardingCard } from "./components/OnboardingCard";
import { OAPLogoBlue } from "@/components/icons/oap-logo-blue";

type IntroGuidedStepProps = {
  className?: string;
  onContinue: () => void;
  onSkip?: () => void;
};

export function IntroGuidedStep({
  className,
  onContinue,
  onSkip,
}: IntroGuidedStepProps) {
  return (
    <div
      className={cn(className, "grid h-screen grid-cols-2 overflow-y-hidden")}
    >
      <div
        className={cn(
          "z-10",
          "flex h-full w-[50%] min-w-[776px] flex-col items-start justify-start rounded-r-[83px] bg-white p-[72px] text-black",
          "shadow-[0_675px_189px_0_rgba(138,118,158,0.00),0_432px_173px_0_rgba(138,118,158,0.01),0_243px_146px_0_rgba(138,118,158,0.05),0_108px_108px_0_rgba(138,118,158,0.09),0_27px_59px_0_rgba(138,118,158,0.10)]",
        )}
      >
        <div className={cn("shrink-0")}>
          <OAPLogoBlue
            width={146}
            height={38}
          />
        </div>

        <h1 className="mt-[125px] text-start text-[48px] leading-[120%] font-normal tracking-[-1.2px] text-[var(--colors-text-text-primary-900,#101828)]">
          How would you like to start?
        </h1>

        <div className="mt-12 flex items-start justify-start">
          <OnboardingCard
            title="Guided setup"
            description="Step through a form to set up your agent. Perfect if you want structure and guidance"
            helperText="Continue"
            onClick={onContinue}
            className="w-[560px] !bg-white hover:!bg-white dark:!bg-white"
            align="left"
            arrowInside
            noOuterHoverBorder
            innerBorder
          />
        </div>

        {onSkip && (
          <div className="mt-auto flex items-center gap-4">
            <button
              type="button"
              className="text-brand-primary flex items-center gap-2 border-b border-[var(--brand-primary)]"
              onClick={onSkip}
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntroGuidedStep;
