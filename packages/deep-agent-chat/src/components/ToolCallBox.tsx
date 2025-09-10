"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  AlertCircle,
  Loader2,
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
    switch (status) {
      case "completed":
        return null;
      case "error":
        return (
          <AlertCircle
            size={14}
            className="text-destructive"
          />
        );
      case "pending":
        return (
          <Loader2
            size={14}
            className="animate-spin"
          />
        );
      default:
        return (
          <Terminal
            size={14}
            className="text-muted-foreground"
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
    <div className="bg-card w-fit max-w-[70vw] overflow-hidden rounded-lg border-none shadow-none outline-none">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpanded}
        className="hover:bg-accent flex w-full items-center justify-between gap-2 border-none px-4 py-2 text-left shadow-none transition-colors duration-200 outline-none disabled:cursor-default"
        disabled={!hasContent}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className="text-[15px] leading-[140%] font-medium tracking-[-0.6px] text-[#3F3F46]">
              {name}
            </span>
          </div>
          {hasContent && (
            <ChevronDown
              size={14}
              className="shrink-0 text-[#70707B]"
            />
          )}
        </div>
      </Button>

      {isExpanded && hasContent && (
        <div className="border-border border-t px-4 pb-4">
          {Object.keys(args).length > 0 && (
            <div className="mt-4">
              <h4 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
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
                        <ChevronDown
                          size={12}
                          className="text-[#70707B]"
                        />
                      ) : (
                        <ChevronRight
                          size={12}
                          className="text-[#70707B]"
                        />
                      )}
                    </button>
                    {expandedArgs[key] && (
                      <div className="border-border bg-muted/10 border-t p-2">
                        <pre className="text-foreground m-0 overflow-x-auto font-mono text-xs leading-6 break-all whitespace-pre-wrap">
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
            <div className="mt-4">
              <h4 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                Result
              </h4>
              <pre className="border-border bg-muted/30 text-foreground m-0 overflow-x-auto rounded-sm border p-2 font-mono text-xs leading-7 break-all whitespace-pre-wrap">
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
