"use client";

import React, { useMemo } from "react";
import { X, Bot, CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownContent } from "./MarkdownContent";
import type { SubAgent } from "../types";

interface SubAgentPanelProps {
  subAgent: SubAgent;
  onClose: () => void;
}

const SubAgentPanelComponent = ({ subAgent, onClose }: SubAgentPanelProps) => {
  const statusIcon = useMemo(() => {
    const iconStyle = { width: "14px", height: "14px" };
    switch (subAgent.status) {
      case "completed":
        return (
          <CheckCircle
            style={{ ...iconStyle, color: "var(--color-success)" }}
          />
        );
      case "error":
        return (
          <AlertCircle style={{ ...iconStyle, color: "var(--color-error)" }} />
        );
      case "pending":
        return (
          <Loader
            style={{ ...iconStyle, color: "var(--color-primary)" }}
            className="animate-spin"
          />
        );
      default:
        return (
          <Clock
            style={{ ...iconStyle, color: "var(--color-text-tertiary)" }}
          />
        );
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
    <div
      className="absolute top-0 right-0 z-10 flex h-full flex-col"
      style={{
        width: "40vw",
        backgroundColor: "var(--color-background)",
        borderLeft: "1px solid var(--color-border)",
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        className="flex items-start justify-between border-b"
        style={{
          padding: "1rem",
          borderBottomColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div
          className="flex flex-1"
          style={{ gap: "0.5rem" }}
        >
          <Bot
            className="shrink-0"
            style={{
              width: "32px",
              height: "32px",
              color: "var(--color-secondary)",
            }}
          />
          <div>
            <h3
              className="text-lg font-semibold"
              style={{
                margin: "0 0 0.25rem 0",
                color: "var(--color-text-primary)",
              }}
            >
              {subAgent.subAgentName}
            </h3>
            <div
              className="flex items-center text-sm"
              style={{
                gap: "0.25rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {statusIcon}
              <span>{statusText}</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="transition-colors duration-200"
          style={{
            padding: "0.25rem",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-border-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={20} />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div style={{ padding: "1.5rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h4
              className="text-xs font-semibold tracking-wider uppercase"
              style={{
                color: "var(--color-text-secondary)",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
              }}
            >
              Input
            </h4>
            <div
              className="rounded-md border"
              style={{
                padding: "1rem",
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border-light)",
              }}
            >
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
            <div style={{ marginBottom: "0" }}>
              <h4
                className="font-semibold tracking-wider uppercase"
                style={{
                  color: "var(--color-text-secondary)",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                Output
              </h4>
              <div
                className="rounded-md border"
                style={{
                  padding: "1rem",
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border-light)",
                }}
              >
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
        </div>
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
