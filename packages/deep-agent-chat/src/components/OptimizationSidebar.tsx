"use client";

import React, { useState, useCallback, useEffect } from "react";
import { OptimizationWindow } from "./OptimizationWindow";
import type { Assistant } from "@langchain/langgraph-sdk";
import { useChatContext } from "../providers/ChatContext";
import { useQueryState } from "nuqs";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface OptimizationSidebarProps {
  activeAssistant: Assistant | null;
  setActiveAssistant: (assistant: Assistant | null) => void;
  setAssistantError: (error: string | null) => void;
  assistantError: string | null;
  onOptimizerToggle?: (isOpen: boolean) => void;
}

export const OptimizationSidebar = React.memo<OptimizationSidebarProps>(
  ({
    activeAssistant,
    setActiveAssistant,
    setAssistantError,
    assistantError,
    onOptimizerToggle,
  }) => {
    const [threadId] = useQueryState("threadId");
    const { messages } = useChatContext();
    const [isTrainingModeExpanded, setIsTrainingModeExpanded] = useState(true);
    const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);

    const handleToggleTrainingMode = useCallback(() => {
      setIsTrainingModeExpanded((prev) => !prev);
    }, []);

    const handleToggleOptimizer = useCallback(() => {
      setIsOptimizerOpen((prev) => !prev);
    }, []);

    // Notify parent when optimizer state changes
    useEffect(() => {
      onOptimizerToggle?.(isOptimizerOpen);
    }, [isOptimizerOpen, onOptimizerToggle]);

    // Early return if assistant is not available or there's an error
    if (!activeAssistant || assistantError) {
      return null;
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col rounded-xl">
        <div className="flex flex-shrink-0 items-center justify-between px-3 pt-2 pb-1.5">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: "#3F3F46" }}
          >
            AGENT CREATOR
          </span>
          <button
            onClick={handleToggleOptimizer}
            className={cn(
              "hover:bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-200",
              isOptimizerOpen ? "rotate-180" : "rotate-0",
            )}
            aria-label="Toggle optimizer panel"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        {isOptimizerOpen && (
          <div className="flex min-h-0 flex-1 flex-col pt-2">
            <OptimizationWindow
              threadId={threadId}
              deepAgentMessages={messages}
              isExpanded={isTrainingModeExpanded}
              onToggle={handleToggleTrainingMode}
              activeAssistant={activeAssistant}
              setActiveAssistant={setActiveAssistant}
              setAssistantError={setAssistantError}
            />
          </div>
        )}
      </div>
    );
  },
);

OptimizationSidebar.displayName = "OptimizationSidebar";
