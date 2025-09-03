"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { Client } from "@langchain/langgraph-sdk";

interface ClientContextValue {
  client: Client;
  optimizerClient?: Client;
}

const ClientContext = createContext<ClientContextValue | null>(null);

interface ClientProviderProps {
  children: ReactNode;
  deploymentUrl: string;
  accessToken?: string;
  optimizerUrl?: string;
  optimizerAccessToken?: string;
}

export function ClientProvider({
  children,
  deploymentUrl,
  accessToken,
  optimizerUrl,
  optimizerAccessToken,
}: ClientProviderProps) {
  const client = useMemo(
    () => {
      // For locally running deployments
      if (!accessToken) {
        return new Client({
          apiUrl: deploymentUrl,
          defaultHeaders: {
            "x-auth-scheme": "langsmith",
          },
        });
      }
      // TODO: Add support for LangSmith authenticated deployments
      // For OAP deployments which require supabase access tokens
      return new Client({
        apiUrl: deploymentUrl,
        defaultHeaders: {
          Authorization: `Bearer ${accessToken}`,
          "x-supabase-access-token": accessToken,
        },
      });
    },
    [deploymentUrl, accessToken]
  );

  const optimizerClient = useMemo(() => {
    if (!optimizerUrl) return undefined;

    if (!optimizerAccessToken) {
      // For locally running deployments
      return new Client({
        apiUrl: optimizerUrl,
        defaultHeaders: {
          "x-auth-scheme": "langsmith",
        },
      });
    }
    // For OAP deployments which require supabase access tokens
    return new Client({
      apiUrl: optimizerUrl,
      defaultHeaders: {
        Authorization: `Bearer ${optimizerAccessToken}`,
        "x-supabase-access-token": optimizerAccessToken,
      },
    });
  }, [optimizerUrl, optimizerAccessToken]);

  const value = useMemo(
    () => ({ client, optimizerClient }),
    [client, optimizerClient]
  );

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClients(): ClientContextValue {
  const context = useContext(ClientContext);
  
  if (!context) {
    throw new Error("useClients must be used within a ClientProvider");
  }
  return context;
}