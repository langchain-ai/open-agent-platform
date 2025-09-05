"use client";

import React, { useMemo } from "react";
import { X, Bot, CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { MarkdownContent } from "./MarkdownContent";
import type { SubAgent } from "../types";

interface SubAgentPanelProps {
  subAgent: SubAgent;
  onClose: () => void;
}

const SubAgentPanelComponent = ({ subAgent, onClose }: SubAgentPanelProps) => {
  const statusIcon = useMemo(() => {
    switch (subAgent.status) {
      case "completed":
        return <CheckCircle className="text-success h-3.5 w-3.5" />;
      case "error":
        return <AlertCircle className="text-destructive h-3.5 w-3.5" />;
      case "pending":
        return <Loader className="text-primary h-3.5 w-3.5 animate-spin" />;
      default:
        return <Clock className="text-tertiary h-3.5 w-3.5 flex-shrink-0" />;
    }
  }, [subAgent.status]);

  const statusText = useMemo(() => {
    switch (subAgent.status) {
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      case "active":
        return "Running";
      default:
        return "Pending";
    }
  }, [subAgent.status]);

  return (
    <div className="bg-background border-border absolute right-0 top-0 z-10 flex h-full w-[40vw] flex-col border-l shadow-lg">
      <div className="border-border bg-surface flex items-start justify-between border-b p-4">
        <div className="flex flex-1 gap-2">
          <Bot className="text-primary size-8 shrink-0" />
          <div>
            <h3 className="text-primary mb-2 text-lg font-semibold">
              {subAgent.subAgentName}
            </h3>
            <div className="text-primary/80 flex items-center gap-1 text-sm">
              {statusIcon}
              <span>{statusText}</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-border-light transition-colors duration-200"
        >
          <X size={20} />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto p-6">
        <div style={{ marginBottom: "2rem" }}>
          <h4 className="text-primary/70 mb-2 text-xs font-semibold uppercase tracking-wider">
            Input
          </h4>
          <div className="bg-surface border-border-light rounded-md border p-4">
            <MarkdownContent
              content={
                typeof subAgent.input === "string"
                  ? subAgent.input
                  : subAgent.input.description &&
                      typeof subAgent.input.description === "string"
                    ? subAgent.input.description
                    : subAgent.input.prompt &&
                        typeof subAgent.input.prompt === "string"
                      ? subAgent.input.prompt
                      : JSON.stringify(subAgent.input, null, 2)
              }
            />
          </div>
        </div>
        {subAgent.output && (
          <div>
            <h4 className="text-primary/70 mb-2 font-semibold uppercase tracking-wider">
              Output
            </h4>
            <div className="bg-surface border-border-light rounded-md border p-4">
              <MarkdownContent
                content={
                  typeof subAgent.output === "string"
                    ? subAgent.output
                    : subAgent.output.result &&
                        typeof subAgent.output.result === "string"
                      ? subAgent.output.result
                      : JSON.stringify(subAgent.output, null, 2)
                }
              />
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export const SubAgentPanel = React.memo(
  SubAgentPanelComponent,
  (prevProps, nextProps) => {
    const inputEqual =
      JSON.stringify(prevProps.subAgent.input) ===
      JSON.stringify(nextProps.subAgent.input);
    const outputEqual =
      JSON.stringify(prevProps.subAgent.output) ===
      JSON.stringify(nextProps.subAgent.output);
    return (
      inputEqual &&
      outputEqual &&
      prevProps.subAgent.status === nextProps.subAgent.status &&
      prevProps.subAgent.id === nextProps.subAgent.id &&
      prevProps.onClose === nextProps.onClose
    );
  },
);

SubAgentPanel.displayName = "SubAgentPanel";
