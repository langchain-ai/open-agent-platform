"use client";

import React from "react";
import { Button } from "./ui/button";
import type { SubAgent } from "../types";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  onClick: () => void;
}

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, onClick }) => {
    return (
      <div
        className="bg-card w-fit overflow-hidden rounded-lg"
        style={{
          maxWidth: "70vw",
          border: "none",
          boxShadow: "none",
          outline: "none",
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="flex w-full items-center justify-between text-left transition-colors duration-200"
          style={{
            padding: "0.5rem 1rem",
            gap: "0.5rem",
            border: "none",
            outline: "none",
            boxShadow: "none",
          }}
        >
          <div
            className="flex w-full items-center justify-between"
            style={{ gap: "0.5rem" }}
          >
            <div
              className="flex items-center"
              style={{ gap: "0.5rem" }}
            >
              <span
                style={{
                  color: "#3F3F46",
                  fontFamily: "Inter",
                  fontSize: "15px",
                  fontStyle: "normal",
                  fontWeight: "700",
                  lineHeight: "140%",
                  letterSpacing: "-0.6px",
                }}
              >
                {subAgent.subAgentName}
              </span>
            </div>
          </div>
        </Button>
      </div>
    );
  },
);

SubAgentIndicator.displayName = "SubAgentIndicator";
