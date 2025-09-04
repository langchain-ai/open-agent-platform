"use client";

import React, { useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";

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

  // Loading state for save operation
  const [isSaving, setIsSaving] = useState(false);

  const { session } = useAuthContext();
  // Handle saving API keys to Supabase
  const handleSaveApiKeys = async () => {
    if (!session?.accessToken || !session?.refreshToken) {
      toast.error("You must be logged in to save API keys");
      return;
    }
    setIsSaving(true);

    try {
      const apiKeys = {
        OPENAI_API_KEY: openaiApiKey,
        ANTHROPIC_API_KEY: anthropicApiKey,
        GOOGLE_API_KEY: googleApiKey,
        TAVILY_API_KEY: tavilyApiKey,
      };

      const response = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": session.accessToken,
          "x-refresh-token": session.refreshToken,
        },
        body: JSON.stringify({ apiKeys }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save API keys");
      }

      await response.json();
      toast.success("API keys saved successfully", { richColors: true });
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save API keys",
      );
    } finally {
      setIsSaving(false);
    }
  };

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

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveApiKeys}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save API Keys"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
