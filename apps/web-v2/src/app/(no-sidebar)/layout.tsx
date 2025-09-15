"use client";

import React from "react";
import { AuthProvider } from "@/providers/Auth";
import { useAuthContext } from "@/providers/Auth";
import LaunchDarklyProvider from "@/providers/LaunchDarkly";
import { MCPProvider } from "@/providers/MCP";
import { AgentsProvider } from "@/providers/Agents";
import Loading from "@/components/ui/loading";

function NoSidebarAuthenticatedApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Loading label="Preparing your workspace" />
      </div>
    );
  }

  return (
    <LaunchDarklyProvider>
      <MCPProvider>
        <AgentsProvider>
          <div className="bg-background min-h-screen">{children}</div>
        </AgentsProvider>
      </MCPProvider>
    </LaunchDarklyProvider>
  );
}

export default function NoSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NoSidebarAuthenticatedApp>{children}</NoSidebarAuthenticatedApp>
    </AuthProvider>
  );
}
