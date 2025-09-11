"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Settings,
  Loader2,
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";
import { Session } from "@/lib/auth/types";
import { McpServerFormData, McpServerConfig } from "@/types/mcp-server";

interface UserApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

async function getUserApiKeys(session: Session): Promise<UserApiKey[]> {
  try {
    if (!session.accessToken || !session.refreshToken) {
      return [];
    }

    const response = await fetch("/api/settings/user-api-keys", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": session.accessToken,
        "x-refresh-token": session.refreshToken,
      },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error("Failed to fetch user API keys");
    }

    const data = await response.json();
    return data.apiKeys || [];
  } catch (error) {
    console.error("Error fetching user API keys:", error);
    toast.error("Failed to fetch user API keys", { richColors: true });
    return [];
  }
}

async function createUserApiKey(
  session: Session,
  name: string,
): Promise<UserApiKey | null> {
  try {
    if (!session.accessToken || !session.refreshToken) {
      throw new Error("No session found");
    }

    const response = await fetch("/api/settings/user-api-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": session.accessToken,
        "x-refresh-token": session.refreshToken,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create API key");
    }

    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error("Error creating user API key:", error);
    toast.error("Failed to create API key", { richColors: true });
    return null;
  }
}

async function deleteUserApiKey(
  session: Session,
  keyId: string,
): Promise<boolean> {
  try {
    if (!session.accessToken || !session.refreshToken) {
      throw new Error("No session found");
    }

    const response = await fetch(`/api/settings/user-api-keys/${keyId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": session.accessToken,
        "x-refresh-token": session.refreshToken,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete API key");
    }

    return true;
  } catch (error) {
    console.error("Error deleting user API key:", error);
    toast.error("Failed to delete API key", { richColors: true });
    return false;
  }
}

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
  const [isSavingToolServer, setIsSavingToolServer] = useState(false);

  // Tool Server state
  const [toolServerConfig, setToolServerConfig] = useState<McpServerFormData>({
    url: "",
    authHeaders: [{ key: "", value: "" }],
  });

  // User-generated API keys state
  const [userApiKeys, setUserApiKeys] = useState<UserApiKey[]>([]);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // External API keys state
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [googleApiKey, setGoogleApiKey] = useState("");

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
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    if (!session) {
      toast.error("You must be logged in to create API keys");
      return;
    }

    setIsCreatingKey(true);
    const newKey = await createUserApiKey(session, newKeyName.trim());

    if (newKey) {
      setUserApiKeys((prev) => [...prev, newKey]);
      setNewKeyName("");
      setShowCreateForm(false);
      toast.success("API key created successfully", { richColors: true });
    }

    setIsCreatingKey(false);
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!session) {
      toast.error("You must be logged in to delete API keys");
      return;
    }

    const success = await deleteUserApiKey(session, keyId);
    if (success) {
      setUserApiKeys((prev) => prev.filter((key) => key.id !== keyId));
      toast.success("API key deleted successfully", { richColors: true });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", { richColors: true });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

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

  const hasRequestedInitialApiKeys = useRef(false);
  useEffect(() => {
    if (!session || !session.accessToken || !session.refreshToken) return;
    if (hasRequestedInitialApiKeys.current) return;

    Promise.all([getUserApiKeys(session), getSavedApiKeys(session)])
      .then(([userKeys, externalKeys]) => {
        setUserApiKeys(userKeys);
        setOpenaiApiKey(externalKeys.OPENAI_API_KEY || "");
        setAnthropicApiKey(externalKeys.ANTHROPIC_API_KEY || "");
        setGoogleApiKey(externalKeys.GOOGLE_API_KEY || "");
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

      {/* User API Keys Section */}
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">API Keys</h2>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            Create API Key
          </Button>
        </div>

        {showCreateForm && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter API key name (e.g., 'Webhook Server')"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleCreateApiKey}
              disabled={isCreatingKey || !newKeyName.trim()}
              size="sm"
            >
              {isCreatingKey ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
            <Button
              onClick={() => {
                setShowCreateForm(false);
                setNewKeyName("");
              }}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}

        {userApiKeys.length > 0 && (
          <div className="space-y-2">
            {userApiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Key className="text-muted-foreground size-4" />
                    <span className="font-medium">{apiKey.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="bg-muted rounded px-2 py-1 text-sm">
                      {visibleKeys.has(apiKey.id)
                        ? apiKey.key
                        : `${apiKey.key.substring(0, 8)}${"*".repeat(24)}`}
                    </code>
                    <Button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="size-3" />
                      ) : (
                        <Eye className="size-3" />
                      )}
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(apiKey.key)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Created {new Date(apiKey.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {userApiKeys.length === 0 && !showCreateForm && (
          <div className="text-muted-foreground py-8 text-center">
            <Key className="mx-auto mb-2 size-8 opacity-50" />
            <p>No API keys created yet</p>
            <p className="text-sm">
              Create an API key to authenticate with webhooks and external
              services
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* External API Keys Section */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-base font-semibold">External API Keys</h2>
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
