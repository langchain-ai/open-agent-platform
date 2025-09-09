"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Audience, audienceToText } from "./constants";

type AudienceStepProps = {
  onBack: () => void;
  onSelect: (audience: Audience) => void;
};

export function AudienceStep({ onBack, onSelect }: AudienceStepProps) {
  return (
    <div className={cn("grid h-screen grid-cols-2 overflow-y-hidden")}> 
      <div
        className={cn(
          "z-10",
          "flex h-full w-[50%] min-w-[776px] flex-col items-start justify-start rounded-r-[83px] bg-white p-[72px] text-black",
          "shadow-[0_675px_189px_0_rgba(138,118,158,0.00),0_432px_173px_0_rgba(138,118,158,0.01),0_243px_146px_0_rgba(138,118,158,0.05),0_108px_108px_0_rgba(138,118,158,0.09),0_27px_59px_0_rgba(138,118,158,0.10)]",
        )}
      >
        <div className={cn("shrink-0")}> 
          <Image src="/oap-onboarding-logo.svg" alt="Onboarding logo" width={146} height={38} priority />
        </div>

        <button
          type="button"
          className="mt-10 -ml-2 mb-6 flex items-center gap-2 text-lg text-[#0A5982]"
          onClick={onBack}
        >
          <ArrowLeft className="size-5" /> Back
        </button>

        <h1 className="text-start text-5xl leading-[120%] font-normal tracking-[-3.36px] text-[var(--colors-text-text-primary-900,#101828)]">
          Who is this agent for?
        </h1>

        <div className="mt-12 flex flex-col items-start justify-start gap-6 overflow-y-auto bg-transparent">
          {Object.values(Audience).map((a) => (
            <button
              key={a}
              type="button"
              className={cn(
                "h-[84px] rounded-full border-2 px-[28px] py-[18px] font-normal",
                "border-[#0A5982] hover:bg-[#F4F3FF]",
              )}
              onClick={() => onSelect(a)}
            >
              <div className="text-[20px] leading-[120%] font-normal tracking-[-0.8px] text-[var(--colors-text-text-primary-900,#101828)]">
                {audienceToText[a]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AudienceStep;


