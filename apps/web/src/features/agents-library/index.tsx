"use client";

import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AgentsInterface from "@/features/agents";
import { AgentsProvider } from "@/providers/Agents";

export default function AgentsLibrary(): React.ReactNode {
  // Triggers UI is hidden in Agent Library; no trigger data needed here.
  const agentIdsWithTriggers = React.useMemo(() => new Set<string>(), []);

  return (
    <AgentsProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agent Library</h2>
          </div>
        </div>

        <Tabs defaultValue="agents" className="w-full">
          {/** TabsList removed: we want content only without toggles */}

          <TabsContent value="agents" className="mt-2">
            <AgentsInterface
              agentIdsWithTriggers={agentIdsWithTriggers}
              hideHeader
              noContainer
            />
          </TabsContent>
          {/** Triggers tab content temporarily removed in Agent Library */}
        </Tabs>
      </div>
    </AgentsProvider>
  );
}
