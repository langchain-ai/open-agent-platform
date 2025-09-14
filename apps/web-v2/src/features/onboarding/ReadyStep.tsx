"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReadyStepProps = {
  onOpenWorkspace: () => void;
  onBack?: () => void;
};

export function ReadyStep({ onOpenWorkspace, onBack }: ReadyStepProps) {
  return (
    <div className={cn("grid h-screen grid-cols-2 overflow-y-hidden")}>
      <div
        className={cn(
          "z-10",
          "flex h-full w-[50%] min-w-[776px] flex-col items-start justify-start rounded-r-[83px] bg-white p-[72px] text-black",
        )}
      >
        <div className={cn("shrink-0")}>
          <Image
            src="/oap-onboarding-logo.svg"
            alt="Onboarding logo"
            width={146}
            height={38}
            priority
          />
        </div>

        <div className="mt-[60px] flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF3F6]">
          <Check className="h-7 w-7 text-[#0A5982]" />
        </div>

        <h1 className="mt-6 text-start text-[48px] leading-[120%] font-normal tracking-[-1.2px] text-[var(--colors-text-text-primary-900,#101828)]">
          Your agent is ready
        </h1>
        <p className="mt-4 max-w-[560px] text-lg leading-[140%] tracking-[-0.2px] text-[#475467]">
          This is a high-level overview of how your agent is set up including
          its main role, any sub-agents, and the tools it will use. You'll be
          able to edit, test, or expand this on the next screen.
        </p>

        <div className="mt-10">
          <Button
            size="lg"
            className="h-[64px] rounded-full bg-[#0A5982] px-8 text-lg hover:bg-[#0a5982]/90"
            onClick={onOpenWorkspace}
          >
            Open in workspace
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReadyStep;
