"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AgentsProvider } from "@/providers/Agents";

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
      <AgentsProvider>
        <AppSidebar />
      </AgentsProvider>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
