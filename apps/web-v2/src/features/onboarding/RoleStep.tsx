"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Roles, roleToText } from "./constants";

type RoleStepProps = {
  onSkip: () => void;
  onBack?: () => void;
  onNext?: () => void;
};

export function RoleStep({ onSkip, onBack, onNext }: RoleStepProps) {
  const [selectedRole, setSelectedRole] = React.useState<string | undefined>();
  const [otherRole, setOtherRole] = React.useState<string>("");

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
          <Image
            src="/oap-onboarding-logo.svg"
            alt="Onboarding logo"
            width={146}
            height={38}
            priority
          />
        </div>

        <button
          type="button"
          className="mt-10 mb-6 -ml-2 flex items-center gap-2 text-lg text-[#0A5982]"
          onClick={() => onBack?.()}
        >
          <ArrowLeft className="size-5" /> Back
        </button>

        <h1 className="text-start text-5xl leading-[120%] font-normal tracking-[-3.36px] text-[var(--colors-text-text-primary-900,#101828)]">
          What's the main goal of your agent?
        </h1>
        <div className="mt-12 flex flex-col items-start justify-start gap-6 overflow-y-auto bg-transparent">
          {Object.values(Roles).map((role) => (
            <div
              key={role}
              className="flex items-start gap-2"
            >
              <button
                type="button"
                className={cn(
                  "h-[84px] rounded-full border-2 px-[28px] py-[18px] font-normal",
                  "border-[#0A5982] hover:bg-[#F4F3FF]",
                  selectedRole === role && "bg-[#F4F3FF]",
                )}
                onClick={() => {
                  setSelectedRole(role);
                  onNext?.();
                }}
              >
                <div className="text-[20px] leading-[120%] font-normal tracking-[-0.8px] text-[var(--colors-text-text-primary-900,#101828)]">
                  {roleToText[role as Roles]}
                </div>
              </button>
              {selectedRole === Roles.OTHER && role === Roles.OTHER && (
                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    className={cn(
                      "border-brand-strong h-[64px] rounded-full border bg-transparent px-5 py-2",
                      "focus:border-brand-strong",
                    )}
                    value={otherRole}
                    onChange={(e) => setOtherRole(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={cn(
                      "hover:bg-brand-green-50 h-[64px] w-[64px] rounded-full bg-[#1C3C3C] px-5 py-2 text-white hover:bg-[#1C3C3C]/90 active:bg-[#1C3C3C]/70 disabled:opacity-50 disabled:hover:bg-[#1C3C3C]",
                    )}
                    disabled={!otherRole}
                  >
                    <Check className="size-6" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-4">
          <button
            type="button"
            className="text-brand-primary flex items-center gap-2 border-b border-[var(--brand-primary)]"
            onClick={onSkip}
          >
            Skip
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleStep;
