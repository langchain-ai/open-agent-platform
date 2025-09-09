"use client";

import React, { useEffect } from "react";

import {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsInteger,
} from "nuqs";
import {
  INBOX_PARAM,
  VIEW_STATE_THREAD_QUERY_PARAM,
  OFFSET_PARAM,
  LIMIT_PARAM,
} from "./constants";
import { AgentInboxView } from "./inbox-view";
import { ThreadView } from "./thread-view";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { usePathname, useSearchParams } from "next/navigation";
import { logger } from "./utils/logger";
import { useAgentsContext } from "@/providers/Agents";

// Wrap the actual implementation in the provider
function AgentInboxWithProvider<
  ThreadValues extends Record<string, any> = Record<string, any>,
>() {
  const [selectedThreadIdParam] = useQueryState(
    VIEW_STATE_THREAD_QUERY_PARAM,
    parseAsString,
  );

  const [selectedInbox, setSelectedInbox] = useQueryState(
    INBOX_PARAM,
    parseAsString.withDefault("interrupted") as any,
  );

  // Use useQueryStates for pagination params
  const [, setPaginationParams] = useQueryStates({
    [OFFSET_PARAM]: parseAsInteger.withDefault(0),
    [LIMIT_PARAM]: parseAsInteger.withDefault(10),
  });

  const [agentInboxId] = useQueryState("agentInbox");
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const processedAgentIdRef = React.useRef<string | null>(null);
  const updateInProgress = React.useRef(false);

  const isStateViewOpen = !!selectedThreadIdParam;
  const prevIsStateViewOpen = React.useRef(false);

  // Need to track first render to avoid restoring scroll on initial page load
  const isFirstRender = React.useRef(true);

  // Track URL changes to detect when the thread ID changes (not just appears/disappears)
  const lastThreadId = React.useRef<string | null>(null);

  // Track navigation events using pathname and search params from Next.js
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const navigationSignature = `${pathname}?${nextSearchParams}`;
  const prevNavigationSignature = React.useRef("");

  // Effect to update parameters when selectedAgentId changes
  React.useEffect(() => {
    // Skip if no selectedAgentId or if we've already processed this agent ID
    if (
      !agentInboxId ||
      agentInboxId === processedAgentIdRef.current ||
      updateInProgress.current
    )
      return;

    // Update ref to prevent processing the same agent multiple times
    processedAgentIdRef.current = agentInboxId;
    updateInProgress.current = true;

    // Use setTimeout to break potential render cycles
    setTimeout(async () => {
      try {
        // When agent selection changes, update relevant query params
        await setSelectedInbox("interrupted");
        await setPaginationParams({
          [OFFSET_PARAM]: 0,
          [LIMIT_PARAM]: 10,
        });
      } finally {
        // Always reset the update flag
        updateInProgress.current = false;
      }
    }, 0);
  }, [agentInboxId, setSelectedInbox, setPaginationParams]);

  // Effect to handle transitions between list and thread views
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip during first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevIsStateViewOpen.current = isStateViewOpen;
      lastThreadId.current = selectedThreadIdParam;
      prevNavigationSignature.current = navigationSignature;
      return;
    }

    // Case 1: Going from list view to thread view
    if (!prevIsStateViewOpen.current && isStateViewOpen) {
      // Try to save scroll position
      if (window.scrollY > 0) {
        saveScrollPosition(); // Save window scroll
      } else if (containerRef.current && containerRef.current.scrollTop > 0) {
        saveScrollPosition(containerRef.current);
      }
    }

    // Update previous state for next render
    prevIsStateViewOpen.current = isStateViewOpen;
    lastThreadId.current = selectedThreadIdParam;
    prevNavigationSignature.current = navigationSignature;
  }, [
    isStateViewOpen,
    selectedThreadIdParam,
    saveScrollPosition,
    navigationSignature,
  ]);

  // Dedicated effect for handling scroll restoration when returning to list view
  React.useLayoutEffect(() => {
    if (
      typeof window === "undefined" ||
      isFirstRender.current ||
      isStateViewOpen
    ) {
      return;
    }

    // Detect navigation (including back button) by checking URL changes
    const isNavigationEvent =
      prevNavigationSignature.current !== navigationSignature;

    // Only run when switching from thread view to list view
    if (
      (prevIsStateViewOpen.current && !isStateViewOpen) ||
      isNavigationEvent
    ) {
      // Use layout effect to run synchronously after DOM mutations but before browser paint
      if (containerRef.current) {
        restoreScrollPosition(containerRef.current);
      } else {
        // Fallback to window scroll
        restoreScrollPosition();
      }
    }
  }, [isStateViewOpen, restoreScrollPosition, navigationSignature]);

  // Initialize parameters if needed
  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      // With nuqs, default values are handled automatically by the parsers
      // This effect can be simplified
      if (!selectedInbox) {
        // Set default inbox
        const initializeParams = async () => {
          await setSelectedInbox("interrupted");
          await setPaginationParams({
            [OFFSET_PARAM]: 0,
            [LIMIT_PARAM]: 10,
          });
        };

        initializeParams();
      }
    } catch (e) {
      logger.error("Error initializing query params", e);
    }
  }, [selectedInbox, setSelectedInbox, setPaginationParams]);

  if (isStateViewOpen) {
    return <ThreadView threadId={selectedThreadIdParam} />;
  }

  return (
    <AgentInboxView<ThreadValues>
      saveScrollPosition={saveScrollPosition}
      containerRef={containerRef as React.RefObject<HTMLDivElement>}
    />
  );
}

// Export the wrapped component
export function AgentInbox<
  ThreadValues extends Record<string, any> = Record<string, any>,
>() {
  const { agents } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentInbox");

  useEffect(() => {
    if (!agents.length || agentId) return;

    const firstAgent = agents[0];
    setAgentId(`${firstAgent.assistant_id}:${firstAgent.deploymentId}`);
  }, [agents, agentId, agents]);

  return <AgentInboxWithProvider<ThreadValues> />;
}
