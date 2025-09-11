"use client";

import React from "react";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/use-local-storage";

/**
 * The Settings interface component containing API Keys configuration.
 */
export default function SettingsInterface(): React.ReactNode {
  // Use localStorage hooks for each API key
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage<string>(
    "lg:settings:openaiApiKey",
    "",
  );
  const [anthropicApiKey, setAnthropicApiKey] = useLocalStorage<string>(
    "lg:settings:anthropicApiKey",
    "",
  );
  const [googleApiKey, setGoogleApiKey] = useLocalStorage<string>(
    "lg:settings:googleApiKey",
    "",
  );
  const [tavilyApiKey, setTavilyApiKey] = useLocalStorage<string>(
    "lg:settings:tavilyApiKey",
    "",
  );

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex w-full items-center justify-start gap-6">
        <div className="flex items-center justify-start gap-2">
          <Settings className="size-6" />
          <p className="text-lg font-semibold tracking-tight">Settings</p>
        </div>
      </div>
      <Separator />

      {/* API Keys Section */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-base font-semibold">API Keys</h2>
        <div className="grid gap-4">
          {/* OpenAI API Key */}
          <div className="grid gap-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <PasswordInput
              id="openai-api-key"
              placeholder="Enter your OpenAI API key"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
          </div>

          {/* Anthropic API Key */}
          <div className="grid gap-2">
            <Label htmlFor="anthropic-api-key">Anthropic API Key</Label>
            <PasswordInput
              id="anthropic-api-key"
              placeholder="Enter your Anthropic API key"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
            />
          </div>

          {/* Google Gen AI API Key */}
          <div className="grid gap-2">
            <Label htmlFor="google-api-key">Google Gen AI API Key</Label>
            <PasswordInput
              id="google-api-key"
              placeholder="Enter your Google Gen AI API key"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
            />
          </div>

          {/* Tavily API Key */}
          <div className="grid gap-2">
            <Label htmlFor="tavily-api-key">Tavily API Key</Label>
            <PasswordInput
              id="tavily-api-key"
              placeholder="Enter your Tavily API key"
              value={tavilyApiKey}
              onChange={(e) => setTavilyApiKey(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
