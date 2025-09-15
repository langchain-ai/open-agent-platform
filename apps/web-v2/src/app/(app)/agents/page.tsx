"use client";

import AgentsLibrary from "@/features/agents-library";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { MCPProvider } from "@/providers/MCP";
import { AgentsProvider } from "@/providers/Agents";

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
        <MCPProvider>
          <AgentsProvider>
            <AgentsLibrary />
          </AgentsProvider>
        </MCPProvider>
      </div>
    </React.Suspense>
  );
}
