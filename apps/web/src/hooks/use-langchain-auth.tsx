import { getApiUrl } from "@/lib/api-url";
import { Tool } from "@/types/tool";
import { useState } from "react";
import { toast } from "sonner";

export function useLangChainAuth() {
  const [authRequiredUrls, setAuthRequiredUrls] = useState<
    {
      provider: string;
      authUrl: string;
    }[]
  >([]);

  const getAuthUrlOrSuccessForProvider = async (
    accessToken: string,
    args: {
      providerId: string;
      scopes: string[];
    },
  ): Promise<boolean | string> => {
    const { providerId, scopes } = args;

    const url = new URL(getApiUrl());
    url.pathname += `/langchain-auth/verify-user-auth-scopes`;
    url.searchParams.set("providerId", providerId);
    url.searchParams.set("scopes", scopes.join(","));
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": accessToken,
      },
    });
    const data = await res.json();
    if (data.success) {
      return true;
    }
    return data.authUrl;
  };

  const verifyUserAuthScopes = async (
    accessToken: string,
    args: {
      enabledToolNames: string[];
      tools: Tool[];
    },
  ): Promise<boolean> => {
    const { enabledToolNames, tools } = args;
    const enabledTools = tools.filter((t) => enabledToolNames.includes(t.name));
    if (enabledTools.length !== enabledToolNames.length) {
      toast.error("One or more tools are not available", {
        richColors: true,
      });
      return false;
    }

    // Group tools by provider and combine scopes
    const providerScopesMap = new Map<string, Set<string>>();

    enabledTools.forEach((tool) => {
      if (tool.auth_provider && tool.scopes?.length) {
        const providerId = tool.auth_provider;
        if (!providerScopesMap.has(providerId)) {
          providerScopesMap.set(providerId, new Set());
        }
        tool.scopes.forEach((scope) => {
          providerScopesMap.get(providerId)!.add(scope);
        });
      }
    });

    // Make one request per provider
    const providerAuthPromises = Array.from(providerScopesMap.entries()).map(
      async ([providerId, scopesSet]) => {
        const scopes = Array.from(scopesSet);
        const authRes = await getAuthUrlOrSuccessForProvider(accessToken, {
          providerId,
          scopes,
        });
        if (typeof authRes === "string") {
          return {
            provider: providerId,
            authUrl: authRes,
          };
        }
        return true;
      },
    );

    const authUrls = (await Promise.all(providerAuthPromises)).filter(
      (res) => typeof res === "object",
    );
    if (authUrls.length) {
      toast.info("Please authenticate with the required tool providers.", {
        richColors: true,
      });

      setAuthRequiredUrls(authUrls);
      return false;
    }

    return true;
  };

  return {
    verifyUserAuthScopes,
    authRequiredUrls,
  };
}
