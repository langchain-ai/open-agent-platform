"use client";

import React from "react";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import type { SubAgent } from "../types";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  onClick: () => void;
}

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, onClick }) => {
    return (
      <div className="bg-card w-fit max-w-[70vw] overflow-hidden rounded-lg border-none shadow-none outline-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="flex w-full items-center justify-between gap-2 border-none px-4 py-2 text-left shadow-none transition-colors duration-200 outline-none"
        >
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-sans text-[15px] leading-[140%] font-bold tracking-[-0.6px] text-[#3F3F46]">
                {subAgent.subAgentName}
              </span>
            </div>
            <ChevronDown
              size={14}
              className="shrink-0 text-[#70707B]"
            />
          </div>
        </Button>
      </div>
    );
  },
);

SubAgentIndicator.displayName = "SubAgentIndicator";
