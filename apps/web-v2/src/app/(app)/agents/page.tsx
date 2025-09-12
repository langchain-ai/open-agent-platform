"use client";

import AgentsInterface from "@/features/agents";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";

/**
 * The /agents page.
 * Contains the list of all agents the user has access to.
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
                <BreadcrumbPage>Agents</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <AgentsProvider>
        <MCPProvider>
          <AgentsInterface />
        </MCPProvider>
      </AgentsProvider>
    </React.Suspense>
  );
}
