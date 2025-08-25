"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { RagProvider } from "@/features/rag/providers/RAG";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(
    pathname !== "/deep-agent-chat",
  );

  useEffect(() => {
    if (pathname === "/deep-agent-chat") {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <MCPProvider>
        <AgentsProvider>
          <RagProvider>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </RagProvider>
        </AgentsProvider>
      </MCPProvider>
    </SidebarProvider>
  );
}
