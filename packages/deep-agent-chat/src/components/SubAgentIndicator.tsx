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
            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-500 dark:text-green-400" />
          );
        case "error":
          return (
            <AlertCircle className="text-destructive h-3.5 w-3.5 flex-shrink-0" />
          );
        case "pending":
          return (
            <Loader className="text-primary h-3.5 w-3.5 flex-shrink-0 animate-spin" />
          );
        default:
          return (
            <Clock className="text-muted-foreground h-3.5 w-3.5 flex-shrink-0" />
          );
      }
    };

    return (
      <button
        onClick={onClick}
        className="bg-avatar-bg hover:bg-subagent-hover flex w-full cursor-pointer items-start gap-4 rounded-md !px-6 !py-4 text-left transition-all duration-200 ease-in-out hover:translate-x-0.5 active:translate-x-0"
        aria-label={`View ${subAgent.name} details`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-start gap-2">
            {getStatusIcon()}
            <span className="text-foreground text-lg font-semibold">
              {subAgent.subAgentName}
            </span>
          </div>
          <p className="text-muted-foreground m-0 line-clamp-2 overflow-hidden text-xs leading-normal">
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
