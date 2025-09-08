"use client";

import React, { useState, useEffect } from "react";
import { DeepAgentChatInterface } from "@open-agent-platform/deep-agent-chat";
import { Settings } from "lucide-react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ConfigurationDialog } from "./ConfigurationDialog";

interface Config {
  assistantId: string;
  deploymentUrl: string;
  langsmithToken?: string;
}

export default function HomePage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedConfig = localStorage.getItem("deep-agent-config");
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.deploymentUrl && parsed.assistantId) {
        setConfig(parsed);
      }
    }
    setIsLoading(false);
  }, []);

  const handleConfigUpdate = (newConfig: Config) => {
    setConfig(newConfig);
  };

  const optimizerDeploymentUrl =
    process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL;
  const optimizerAccessToken = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY;

  if (!optimizerDeploymentUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
          <h1 className="mb-4 text-center text-2xl font-bold text-foreground">
            Set your Optimizer Configuration in your Environment Variables
          </h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <div className="flex h-screen w-screen items-center justify-center">
          <ConfigurationDialog
            config={config}
            onConfigUpdate={handleConfigUpdate}
            required={true}
          />
        </div>
      </React.Suspense>
    );
  }

  const SettingsButtonComponent = ({ className }: { className?: string }) => (
    <ConfigurationDialog
      config={config}
      onConfigUpdate={handleConfigUpdate}
      trigger={
        <button
          className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className || "h-9 px-3"}`}
        >
          <Settings className="h-4 w-4" />
          Deep Agent Settings
        </button>
      }
    />
  );

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <NuqsAdapter>
        <div className="h-screen w-screen">
          <DeepAgentChatInterface
            assistantId={config.assistantId}
            deploymentUrl={config.deploymentUrl}
            accessToken={config.langsmithToken || ""}
            optimizerDeploymentUrl={optimizerDeploymentUrl}
            optimizerAccessToken={optimizerAccessToken}
            mode="standalone"
            SidebarTrigger={SettingsButtonComponent}
          />
        </div>
      </NuqsAdapter>
    </React.Suspense>
  );
}
