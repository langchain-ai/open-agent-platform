"use client";

import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/providers/Auth";
import { useAuthContext } from "@/providers/Auth";
import LaunchDarklyProvider from "@/providers/LaunchDarkly";
import { MCPProvider } from "@/providers/MCP";
import Loading from "@/components/ui/loading";

function NoSidebarAuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthContext();

  // Show loading until auth is complete
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Loading label="Preparing your workspace" />
      </div>
    );
  }

  // Only render the app with LaunchDarkly and MCP after auth is complete
  return (
    <LaunchDarklyProvider>
      <MCPProvider>
        <div className="min-h-screen bg-background">
          {children}
        </div>
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