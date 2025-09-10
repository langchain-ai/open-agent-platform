"use client";

import React, { useState, useCallback } from "react";
import { OptimizationWindow } from "./OptimizationWindow";
import type { Assistant } from "@langchain/langgraph-sdk";
import { useChatContext } from "../providers/ChatContext";
import { useQueryState } from "nuqs";

interface OptimizationSidebarProps {
  activeAssistant: Assistant | null;
  setActiveAssistant: (assistant: Assistant | null) => void;
  setAssistantError: (error: string | null) => void;
  assistantError: string | null;
}

export const OptimizationSidebar = React.memo<OptimizationSidebarProps>(
  ({
    activeAssistant,
    setActiveAssistant,
    setAssistantError,
    assistantError,
  }) => {
    const [threadId] = useQueryState("threadId");
    const { messages } = useChatContext();
    const [isTrainingModeExpanded, setIsTrainingModeExpanded] = useState(true);

    const handleToggleTrainingMode = useCallback(() => {
      setIsTrainingModeExpanded((prev) => !prev);
    }, []);

    // Early return if assistant is not available or there's an error
    if (!activeAssistant || assistantError) {
      return null;
    }

    return (
      <div className="min-h-0 w-[25vw] flex-1">
        <div className="bg-background flex h-full w-full flex-col">
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
      </div>
    );
  },
);

OptimizationSidebar.displayName = "OptimizationSidebar";
