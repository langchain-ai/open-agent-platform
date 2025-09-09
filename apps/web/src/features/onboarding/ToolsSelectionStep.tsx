"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { Button } from "@/components/ui/button";
import _ from "lodash";

type ToolsSelectionStepProps = {
  onSkip: () => void;
  onContinue: () => void;
  onBack: () => void;
  onCreate?: (selected: string[]) => void;
};

export default function ToolsSelectionStep({
  onSkip,
  onContinue,
  onBack,
  onCreate,
}: ToolsSelectionStepProps) {
  const { tools } = useMCPContext();
  const { displayTools } = useSearchTools(tools);
  const [selected, setSelected] = React.useState<string[]>([]);

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
          className="mt-6 mb-6 -ml-2 flex items-center gap-2 text-lg text-black"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1 className="text-start text-[48px] leading-[120%] font-normal tracking-[-1.2px] text-[var(--colors-text-text-primary-900,#101828)]">
          What kind of tools do you want to connect?
        </h1>
        <p className="mt-2 max-w-[640px] text-[16px] leading-[20px] tracking-[-0.2px] text-[var(--colours-text-text-quaternary-500,#70707B)]">
          Pick the ones you're likely to use, this helps us set up your agent.
          You can always add or remove tools later.
        </p>

        <div className="mt-8 grid w-full max-w-[640px] grid-cols-2 gap-4">
          {displayTools.slice(0, 12).map((tool, idx) => (
            <label
              key={`${tool.name}:${idx}`}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#2F6868] px-[36px] py-[24px]"
            >
              <input
                type="checkbox"
                className="size-5 appearance-none rounded-full border-2 border-[#2F6868] checked:border-[#0A5982] checked:bg-[#0A5982]"
                checked={selected.includes(tool.name)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, tool.name]
                      : prev.filter((t) => t !== tool.name),
                  )
                }
              />
              <span className="text-[20px] leading-[120%] font-normal tracking-[-0.2px] text-[var(--colors-text-text-primary-900,#101828)]">
                {_.startCase(tool.name)}
              </span>
            </label>
          ))}
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
            onClick={() => (onCreate ? onCreate(selected) : onContinue())}
          >
            Create Agent
          </Button>
        </div>
      </div>
    </div>
  );
}
