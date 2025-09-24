"use client";

import React from "react";
import { useAuthContext } from "@/providers/Auth";
import { SidebarLayout } from "@/components/sidebar";
import LaunchDarklyProvider from "@/providers/LaunchDarkly";
import { OAuthProvidersProvider } from "@/hooks/use-oauth-providers";
import Loading from "@/components/ui/loading";

export function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthContext();

  // Show loading until auth is complete
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Loading label="Preparing your workspace" />
      </div>
    );
  }

  // Only render the app with LaunchDarkly after auth is complete
  return (
    <LaunchDarklyProvider>
      <OAuthProvidersProvider>
        <SidebarLayout>{children}</SidebarLayout>
      </OAuthProvidersProvider>
    </LaunchDarklyProvider>
  );
}
