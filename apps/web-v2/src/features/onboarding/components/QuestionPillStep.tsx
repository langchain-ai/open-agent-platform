"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { OAPLogoBlue } from "@/components/icons/oap-logo-blue";

export type PillOption = {
  id: string;
  label: string;
};

type QuestionPillStepProps = {
  title: string;
  options: PillOption[];
  onBack: () => void;
  onSelect: (id: string) => void;
  footer?: React.ReactNode;
};

export function QuestionPillStep({
  title,
  options,
  onBack,
  onSelect,
  footer,
}: QuestionPillStepProps) {
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
          <OAPLogoBlue
            width={146}
            height={38}
          />
        </div>

        <button
          type="button"
          className="mt-10 mb-6 -ml-2 flex items-center gap-2 text-lg text-[#0A5982]"
          onClick={onBack}
        >
          <ArrowLeft className="size-5" /> Back
        </button>

        <h1 className="text-start text-[48px] leading-[120%] font-normal tracking-[-1.2px] text-[var(--colors-text-text-primary-900,#101828)]">
          {title}
        </h1>

        <div className="mt-12 flex flex-col items-start justify-start gap-6 overflow-y-auto bg-transparent">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={cn(
                "flex h-[64px] items-center justify-center rounded-[64px] border px-[20px] py-0 font-normal",
                "border-[#2F6868] hover:bg-[#F4F3FF]",
              )}
              onClick={() => onSelect(opt.id)}
            >
              <div className="text-center text-[20px] leading-[120%] font-normal tracking-[-0.2px] text-[var(--colors-text-text-primary-900,#101828)]">
                {opt.label}
              </div>
            </button>
          ))}
        </div>
        {footer && <div className="mt-8 w-full">{footer}</div>}
      </div>
    </div>
  );
}

export default QuestionPillStep;
