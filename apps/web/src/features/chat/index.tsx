"use client";

import React, { useState, useRef, useEffect } from "react";
import { StreamProvider } from "@/features/chat/providers/Stream";
import { Thread } from "./components/thread";
import { ConfigurationSidebar } from "./components/configuration-sidebar";
import { ThreadHistorySidebar } from "./components/thread-history-sidebar";
import { SidebarButtons } from "./components/sidebar-buttons";
import { ArtifactProvider } from "./components/artifact/artifact";

/**
 * The parent component containing the chat interface.
 */
export default function ChatInterface(): React.ReactNode {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if the click is on a portal element (dialog, select menu, etc.)
      // Common portal containers have these class names or data attributes
      const isPortalElement =
        document.querySelector('[role="dialog"]')?.contains(target) ||
        document.querySelector('[role="listbox"]')?.contains(target) ||
        document.querySelector(".cm-tooltip")?.contains(target) ||
        document.querySelector(".popover")?.contains(target) ||
        document.querySelector(".dropdown")?.contains(target) ||
        document
          .querySelector("[data-radix-popper-content-wrapper]")
          ?.contains(target) ||
        // Alert components
        document.querySelector('[role="alertdialog"]')?.contains(target) ||
        document.querySelector(".alert")?.contains(target) ||
        document.querySelector(".alert-dialog")?.contains(target) ||
        document.querySelector(".alert-dialog-content")?.contains(target) ||
        Array.from(document.querySelectorAll('[class*="alert"]')).some((el) =>
          el.contains(target),
        );

      // If the click is on a portal element, don't close the sidebar
      if (isPortalElement) {
        return;
      }

      // Check if history sidebar is open and the click is outside of it and the buttons
      if (
        historyOpen &&
        historyRef.current &&
        !historyRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setHistoryOpen(false);
      }

      // Check if config sidebar is open and the click is outside of it and the buttons
      if (
        configOpen &&
        configRef.current &&
        !configRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setConfigOpen(false);
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [historyOpen, configOpen]);

  return (
    <StreamProvider>
      <ArtifactProvider>
        <div className="flex h-full overflow-x-hidden">
          <Thread />
          <SidebarButtons
            ref={buttonRef}
            historyOpen={historyOpen}
            setHistoryOpen={setHistoryOpen}
            configOpen={configOpen}
            setConfigOpen={setConfigOpen}
          />
          <ThreadHistorySidebar
            ref={historyRef}
            open={historyOpen}
            setOpen={setHistoryOpen}
          />
          <ConfigurationSidebar
            ref={configRef}
            open={configOpen}
          />
        </div>
      </ArtifactProvider>
    </StreamProvider>
  );
}
