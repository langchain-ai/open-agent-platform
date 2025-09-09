"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type OnboardingProgressProps = {
  steps: string[];
  currentIndex: number; // 0-based index of the current phase
  className?: string;
};

export function OnboardingProgress({ steps, currentIndex, className }: OnboardingProgressProps) {
  const percentComplete = Math.max(0, Math.min(100, Math.round(((currentIndex + 1) / steps.length) * 100)));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex w-full items-center gap-6">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-[12px] flex-1 rounded-md",
              idx < currentIndex && "bg-[#0A7AC0]",
              idx === currentIndex && "bg-[#5AC0F3]",
              idx > currentIndex && "bg-gray-200",
            )}
          />
        ))}
      </div>

      <div className="mt-3 grid w-full grid-cols-5 gap-6">
        {steps.map((label, idx) => (
          <div
            key={label}
            className={cn(
              "text-sm",
              idx <= currentIndex ? "text-[var(--colors-text-text-primary-900,#101828)]" : "text-gray-400",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 text-sm text-gray-500">{percentComplete}% complete</div>
    </div>
  );
}

export default OnboardingProgress;


