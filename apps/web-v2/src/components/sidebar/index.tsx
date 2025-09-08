"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(pathname !== "/chat");

  useEffect(() => {
    if (pathname === "/chat") {
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
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </AgentsProvider>
      </MCPProvider>
    </SidebarProvider>
  );
}
