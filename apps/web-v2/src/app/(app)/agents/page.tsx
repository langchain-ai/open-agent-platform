"use client";

import AgentsInterface from "@/features/agents";
import TriggersInterface from "@/features/triggers";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";

/**
 * The /agents page.
 * Contains the list of all agents the user has access to and triggers.
 */
export default function AgentsPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Agent Library</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agent Library</h2>
          </div>
        </div>

        <Tabs
          defaultValue="agents"
          className="w-full"
        >
          <div className="flex items-center gap-8">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="agents"
                className="text-muted-foreground data-[state=active]:text-foreground after:bg-muted-foreground/30 data-[state=active]:after:bg-foreground relative border-none bg-transparent px-0 py-2 text-sm font-medium after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:content-[''] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-none data-[state=active]:after:h-1"
              >
                My Agents
              </TabsTrigger>
              <TabsTrigger
                value="triggers"
                className="text-muted-foreground data-[state=active]:text-foreground after:bg-muted-foreground/30 data-[state=active]:after:bg-foreground relative ml-8 border-none bg-transparent px-0 py-2 text-sm font-medium after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:content-[''] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-none data-[state=active]:after:h-1"
              >
                Triggers
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="agents"
            className="mt-6"
          >
            <AgentsProvider>
              <MCPProvider>
                <AgentsInterface />
              </MCPProvider>
            </AgentsProvider>
          </TabsContent>

          <TabsContent
            value="triggers"
            className="mt-6"
          >
            <TriggersInterface />
          </TabsContent>
        </Tabs>
      </div>
    </React.Suspense>
  );
}
