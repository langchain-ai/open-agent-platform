"use client";

import { EditorPageContent } from "@/features/editor";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import React from "react";

/**
 * Editor page (/editor).
 * Contains a chat UI on the left and agent configuration on the right.
 */
export default function EditorPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading editor...</div>}>
      <AgentsProvider>
        <MCPProvider>
          <EditorPageContent />
        </MCPProvider>
      </AgentsProvider>
    </React.Suspense>
  );
}
