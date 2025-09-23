"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AgentsProvider>
        <MCPProvider>
          <AppSidebar />
        </MCPProvider>
      </AgentsProvider>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
