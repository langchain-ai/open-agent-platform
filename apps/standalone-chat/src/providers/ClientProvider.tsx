"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { Client } from "@langchain/langgraph-sdk";

interface ClientContextValue {
  client: Client;
}

const ClientContext = createContext<ClientContextValue | null>(null);

interface ClientProviderProps {
  children: ReactNode;
  deploymentUrl: string;
  apiKey: string;
}

export function ClientProvider({
  children,
  deploymentUrl,
  apiKey,
}: ClientProviderProps) {
  const client = useMemo(() => {
    return new Client({
      apiUrl: deploymentUrl,
      defaultHeaders: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
    });
  }, [deploymentUrl, apiKey]);

  const value = useMemo(() => ({ client }), [client]);

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export function useClient(): Client {
  const context = useContext(ClientContext);

  if (!context) {
    throw new Error("useClient must be used within a ClientProvider");
  }
  return context.client;
}

// Alias for compatibility with copied code
export function useClients() {
  return { client: useClient(), optimizerClient: undefined };
}
