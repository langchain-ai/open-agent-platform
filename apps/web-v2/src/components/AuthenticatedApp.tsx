"use client";

import React from "react";
import { useAuthContext } from "@/providers/Auth";
import { SidebarLayout } from "@/components/sidebar";
import LaunchDarklyProvider from "@/providers/LaunchDarkly";

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthContext();

  // Show loading until auth is complete
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Only render the app with LaunchDarkly after auth is complete
  return (
    <LaunchDarklyProvider>
      <SidebarLayout>{children}</SidebarLayout>
    </LaunchDarklyProvider>
  );
}
