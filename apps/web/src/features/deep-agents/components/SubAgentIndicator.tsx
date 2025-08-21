"use client";

import React from "react";
import { CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import type { SubAgent } from "../types";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  onClick: () => void;
}

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, onClick }) => {
    const getStatusIcon = () => {
      switch (subAgent.status) {
        case "completed":
          return (
            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-[#10b981] dark:text-[#34d399]" />
          );
        case "error":
          return (
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-[#ef4444] dark:text-[#f87171]" />
          );
        case "pending":
          return (
            <Loader className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-[#1c3c3c] dark:text-[#2dd4bf]" />
          );
        default:
          return (
            <Clock className="h-3.5 w-3.5 flex-shrink-0 text-[#9ca3af] dark:text-[#6b7280]" />
          );
      }
    };

    return (
      <button
        onClick={onClick}
        className="flex w-full cursor-pointer items-start gap-4 rounded-md !px-6 !py-4 text-left transition-all duration-200 ease-in-out hover:translate-x-0.5 active:translate-x-0"
        style={{
          backgroundColor: "var(--color-avatar-bg)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-subagent-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--color-avatar-bg)";
        }}
        aria-label={`View ${subAgent.name} details`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-start gap-2">
            {getStatusIcon()}
            <span className="text-lg font-semibold text-[#111827] dark:text-[#f3f4f6]">
              {subAgent.subAgentName}
            </span>
          </div>
          <p className="m-0 line-clamp-2 overflow-hidden text-xs leading-normal text-[#6b7280] dark:text-[#9ca3af]">
            {typeof subAgent.input === "string"
              ? subAgent.input
              : subAgent.input.description &&
                  typeof subAgent.input.description === "string"
                ? subAgent.input.description
                : JSON.stringify(subAgent.input)}
          </p>
        </div>
      </button>
    );
  },
);

SubAgentIndicator.displayName = "SubAgentIndicator";
