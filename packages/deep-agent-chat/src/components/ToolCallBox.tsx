"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Button } from "./ui/button";
import { ToolCall } from "../types";

interface ToolCallBoxProps {
  toolCall: ToolCall;
}

export const ToolCallBox = React.memo<ToolCallBoxProps>(({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { name, args, result, status } = useMemo(() => {
    const toolName = toolCall.name || "Unknown Tool";
    const toolArgs = toolCall.args || "{}";
    let parsedArgs = {};
    try {
      parsedArgs =
        typeof toolArgs === "string" ? JSON.parse(toolArgs) : toolArgs;
    } catch {
      parsedArgs = { raw: toolArgs };
    }
    const toolResult = toolCall.result || null;
    const toolStatus = toolCall.status || "completed";

    return {
      name: toolName,
      args: parsedArgs,
      result: toolResult,
      status: toolStatus,
    };
  }, [toolCall]);

  const statusIcon = useMemo(() => {
    const iconStyle = { width: "14px", height: "14px" };
    switch (status) {
      case "completed":
        return (
          <CheckCircle
            style={{ ...iconStyle, color: "var(--color-success)" }}
          />
        );
      case "error":
        return (
          <AlertCircle style={{ ...iconStyle, color: "var(--color-destructive)" }} />
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
          <Terminal
            style={{ ...iconStyle, color: "var(--color-muted-foreground)" }}
          />
        );
    }
  }, [status]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const hasContent = result || Object.keys(args).length > 0;

  return (
    <div
      className="w-fit overflow-hidden rounded-lg border-2 border-border bg-card shadow-sm"
      style={{
        maxWidth: "70vw",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between text-left transition-colors duration-200 disabled:cursor-default"
        style={{
          padding: "0.5rem 1rem",
          gap: "0.5rem",
        }}
        disabled={!hasContent}
        onMouseEnter={(e) => {
          if (hasContent) {
            e.currentTarget.style.backgroundColor = "var(--color-accent)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div
          className="flex items-center"
          style={{ gap: "0.5rem" }}
        >
          {hasContent && isExpanded ? (
            <ChevronDown
              size={14}
              className="shrink-0"
            />
          ) : (
            <ChevronRight
              size={14}
              className="shrink-0"
            />
          )}
          {statusIcon}
          <span
            className="text-sm font-medium text-foreground"
          >
            {name}
          </span>
        </div>
      </Button>

      {isExpanded && hasContent && (
        <div
          className="border-t border-border"
          style={{
            padding: "0 1rem 1rem",
          }}
        >
          {Object.keys(args).length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h4
                className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
                style={{
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                }}
              >
                Arguments
              </h4>
              <pre
                className="text-xs overflow-x-auto rounded-sm border border-border font-mono break-all whitespace-pre-wrap bg-muted/30 text-foreground"
                style={{
                  padding: "0.5rem",
                  lineHeight: "1.75",
                  margin: "0",
                  fontFamily:
                    '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                }}
              >
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div style={{ marginTop: "1rem" }}>
              <h4
                className="text-xs font-semibold tracking-wider uppercase text-muted-foreground"
                style={{
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                }}
              >
                Result
              </h4>
              <pre
                className="text-xs overflow-x-auto rounded-sm border border-border font-mono break-all whitespace-pre-wrap bg-muted/30 text-foreground"
                style={{
                  padding: "0.5rem",
                  lineHeight: "1.75",
                  margin: "0",
                  fontFamily:
                    '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                }}
              >
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ToolCallBox.displayName = "ToolCallBox";
