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
  const [expandedArgs, setExpandedArgs] = useState<Record<string, boolean>>({});

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
          <AlertCircle
            style={{ ...iconStyle, color: "var(--color-destructive)" }}
          />
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

  const toggleArgExpanded = useCallback((argKey: string) => {
    setExpandedArgs((prev) => ({
      ...prev,
      [argKey]: !prev[argKey],
    }));
  }, []);

  const hasContent = result || Object.keys(args).length > 0;

  return (
    <div
      className="border-border bg-card w-fit overflow-hidden rounded-lg border-2 shadow-sm"
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
          <span className="text-foreground text-sm font-medium">{name}</span>
        </div>
      </Button>

      {isExpanded && hasContent && (
        <div
          className="border-border border-t"
          style={{
            padding: "0 1rem 1rem",
          }}
        >
          {Object.keys(args).length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h4
                className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                style={{
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                }}
              >
                Arguments
              </h4>
              <div className="space-y-2">
                {Object.entries(args).map(([key, value]) => (
                  <div
                    key={key}
                    className="border-border rounded-sm border"
                  >
                    <button
                      onClick={() => toggleArgExpanded(key)}
                      className="bg-muted/20 hover:bg-muted/40 flex w-full items-center justify-between p-2 text-left text-xs font-medium transition-colors"
                    >
                      <span className="font-mono">{key}</span>
                      {expandedArgs[key] ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    {expandedArgs[key] && (
                      <div className="border-border bg-muted/10 border-t p-2">
                        <pre
                          className="text-foreground overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs"
                          style={{
                            lineHeight: "1.5",
                            margin: "0",
                            fontFamily:
                              '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                          }}
                        >
                          {typeof value === "string"
                            ? value
                            : JSON.stringify(value, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {result && (
            <div style={{ marginTop: "1rem" }}>
              <h4
                className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
                style={{
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                }}
              >
                Result
              </h4>
              <pre
                className="border-border bg-muted/30 text-foreground overflow-x-auto whitespace-pre-wrap break-all rounded-sm border font-mono text-xs"
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
