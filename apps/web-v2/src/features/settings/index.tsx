"use client";

import React, { useEffect, useRef, useState } from "react";
import { Settings, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";
import { Session } from "@/lib/auth/types";

async function getSavedApiKeys(
  session: Session,
): Promise<Record<string, string>> {
  try {
    if (!session.accessToken || !session.refreshToken) {
      toast.error("No session found", { richColors: true });
      return {};
    }

    const response = await fetch("/api/settings/api-keys", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": session.accessToken,
        "x-refresh-token": session.refreshToken,
      },
    });

    if (response.status === 404) {
      const errorData = await response.json();
      if (errorData.error === "No API keys found") {
        return {};
      }
    }

    if (!response.ok) {
      throw new Error("Failed to fetch API keys");
    }

    const data = await response.json();
    return data.apiKeys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    toast.error("Failed to fetch API keys", { richColors: true });
    return {};
  }
}

/**
 * The Settings interface component containing API Keys configuration.
 */
export default function SettingsInterface(): React.ReactNode {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");

  const { session } = useAuthContext();

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
      let errMessage = "Failed to save API keys";
      if (
        typeof error === "object" &&
        error &&
        "message" in error &&
        error.message &&
        typeof error.message === "string"
      ) {
        errMessage = error.message;
      }
      toast.error(errMessage, { richColors: true });
    } finally {
      setIsSaving(false);
    }
  };

  const hasRequestedInitialApiKeys = useRef(false);
  useEffect(() => {
    if (!session || !session.accessToken || !session.refreshToken) return;
    if (hasRequestedInitialApiKeys.current) return;
    getSavedApiKeys(session)
      .then((apiKeys) => {
        setOpenaiApiKey(apiKeys.OPENAI_API_KEY || "");
        setAnthropicApiKey(apiKeys.ANTHROPIC_API_KEY || "");
        setGoogleApiKey(apiKeys.GOOGLE_API_KEY || "");
      })
      .finally(() => setLoading(false));
    hasRequestedInitialApiKeys.current = true;
  }, [session]);

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
              disabled={loading || isSaving}
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
              disabled={loading || isSaving}
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
              disabled={loading || isSaving}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveApiKeys}
            disabled={isSaving || loading}
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
