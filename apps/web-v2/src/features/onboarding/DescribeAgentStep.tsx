"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type DescribeAgentStepProps = {
  onSkip: () => void;
  onContinue: () => void;
  name: string;
  description: string;
  setName: (v: string) => void;
  setDescription: (v: string) => void;
};

export default function DescribeAgentStep({
  onSkip,
  onContinue,
  name,
  description,
  setName,
  setDescription,
}: DescribeAgentStepProps) {
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

        <h1 className="font-weight-[400] line-height-[120%] letter-spacing-[-7px] mt-[40px] pb-[12px] text-start text-[58px] leading-[120%] tracking-[-1.2px] text-[var(--colors-text-text-primary-900,#101828)]">
          Describe your agent
        </h1>
        <p className="mt-2 max-w-[640px] text-[16px] leading-[20px] tracking-[-0.2px]">
          Tell us what your agent should do. We'll use your description to
          automatically draft an initial version of your agent.
        </p>

        <div className="mt-8 flex w-full max-w-[640px] flex-col gap-6">
          <div className="flex w-full flex-col gap-2 text-[#3F3F46]">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              placeholder="e.g Customer Support"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-2 text-[#3F3F46]">
            <Label htmlFor="agent-description">Description</Label>
            <Textarea
              id="agent-description"
              placeholder="e.g. Handles common customer questions, provides troubleshooting steps, and escalates complex issues to a human."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-[350px] placeholder:text-[#70707B]"
            />
            <span className="text-muted-foreground text-xs">
              The clearer you are, the better your agent will match your needs.
            </span>
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
            Select tools
          </Button>
        </div>
      </div>
    </div>
  );
}
