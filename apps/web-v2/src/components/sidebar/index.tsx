"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(
    pathname !== "/chat" && pathname !== "/agents/chat",
  );

  useEffect(() => {
    if (pathname === "/chat" || pathname === "/agents/chat") {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
      <AgentsProvider>
        <MCPProvider>
          <AppSidebar />
        </MCPProvider>
      </AgentsProvider>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
