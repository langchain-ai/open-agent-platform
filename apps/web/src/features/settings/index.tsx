"use client";

import React, { useState, useEffect } from "react";
import { Settings, Loader2, Plus, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";
import { McpServerFormData, McpServerConfig } from "@/types/mcp-server";

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

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToolServer, setIsSavingToolServer] = useState(false);

  // Tool Server state
  const [toolServerConfig, setToolServerConfig] = useState<McpServerFormData>({
    url: "",
    authHeaders: [{ key: "", value: "" }],
  });

  const { session } = useAuthContext();

  // Load existing tool server configuration
  useEffect(() => {
    const loadToolServerConfig = async () => {
      if (!session?.accessToken || !session?.refreshToken) {
        return;
      }

      try {
        const response = await fetch("/api/settings/tool-server", {
          method: "GET",
          headers: {
            "x-access-token": session.accessToken,
            "x-refresh-token": session.refreshToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.mcpServer) {
            const config: McpServerConfig = data.mcpServer;
            const authHeaders = Object.entries(config.auth || {}).map(
              ([key, value]) => ({
                key,
                value,
              }),
            );

            setToolServerConfig({
              url: config.url || "",
              authHeaders:
                authHeaders.length > 0 ? authHeaders : [{ key: "", value: "" }],
            });
          }
        }
      } catch (error) {
        console.error("Error loading tool server configuration:", error);
      }
    };

    loadToolServerConfig();
  }, [session?.accessToken, session?.refreshToken]);

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

  const handleSaveToolServer = async () => {
    if (!session?.accessToken || !session?.refreshToken) {
      toast.error("You must be logged in to save tool server configuration");
      return;
    }
    setIsSavingToolServer(true);

    try {
      // Convert form data to the expected format
      const auth: Record<string, string> = {};
      toolServerConfig.authHeaders.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          auth[key.trim()] = value.trim();
        }
      });

      const mcpServerConfig = {
        url: toolServerConfig.url.trim(),
        auth,
      };

      const response = await fetch("/api/settings/tool-server", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": session.accessToken,
          "x-refresh-token": session.refreshToken,
        },
        body: JSON.stringify({ mcpServer: mcpServerConfig }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to save tool server configuration",
        );
      }

      await response.json();
      toast.success("Tool server configuration saved successfully", {
        richColors: true,
      });
    } catch (error) {
      console.error("Error saving tool server configuration:", error);
      let errMessage = "Failed to save tool server configuration";
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
      setIsSavingToolServer(false);
    }
  };

  const addAuthHeader = () => {
    setToolServerConfig((prev) => ({
      ...prev,
      authHeaders: [...prev.authHeaders, { key: "", value: "" }],
    }));
  };

  const removeAuthHeader = (index: number) => {
    setToolServerConfig((prev) => ({
      ...prev,
      authHeaders: prev.authHeaders.filter((_, i) => i !== index),
    }));
  };

  const updateAuthHeader = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setToolServerConfig((prev) => ({
      ...prev,
      authHeaders: prev.authHeaders.map((header, i) =>
        i === index ? { ...header, [field]: value } : header,
      ),
    }));
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

      <Separator />

      {/* Tool Server Section */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-base font-semibold">Tool Server</h2>
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
          <p>
            <strong>Note:</strong> The following headers are automatically
            included with all requests to your custom tool server:
          </p>
          <ul className="mt-1 list-inside list-disc pl-4">
            <li>
              <code>x-api-key</code>: LangSmith API key for tool server
              authentication
            </li>
            <li>
              <code>x-supabase-user-id</code>: Your unique user identifier
            </li>
          </ul>
        </div>
        <div className="grid gap-4">
          {/* Tool Server URL */}
          <div className="grid gap-2">
            <Label htmlFor="tool-server-url">Tool Server URL</Label>
            <Input
              id="tool-server-url"
              placeholder="Enter your tool server URL"
              value={toolServerConfig.url}
              onChange={(e) =>
                setToolServerConfig((prev) => ({
                  ...prev,
                  url: e.target.value,
                }))
              }
            />
          </div>

          {/* Auth Headers */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Authentication Headers (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAuthHeader}
                className="h-8 px-2 text-xs"
              >
                <Plus className="mr-1 size-3" />
                Add Header
              </Button>
            </div>
            <div className="space-y-2">
              {toolServerConfig.authHeaders.map((header, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Header name (e.g. Authorization)"
                      value={header.key}
                      onChange={(e) =>
                        updateAuthHeader(index, "key", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <PasswordInput
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) =>
                        updateAuthHeader(index, "value", e.target.value)
                      }
                    />
                  </div>
                  {toolServerConfig.authHeaders.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAuthHeader(index)}
                      className="h-10 w-10 p-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveToolServer}
            disabled={isSavingToolServer}
            className="min-w-[120px]"
          >
            {isSavingToolServer ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Tool Server"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
