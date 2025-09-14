"use client";

import React from "react";
import OnboardingDialog from "@/features/onboarding/OnboardingDialog";
import { MCPProvider } from "@/providers/MCP";
import { AuthProvider } from "@/providers/Auth";

export default function DummyOnboardingPage() {
  return (
    <AuthProvider>
      <MCPProvider>
        <OnboardingDialog initialOpen={true} />
      </MCPProvider>
    </AuthProvider>
  );
}
