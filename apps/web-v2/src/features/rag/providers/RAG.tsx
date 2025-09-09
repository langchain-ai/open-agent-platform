import React, { createContext, useContext, PropsWithChildren } from "react";
import { useRag } from "../hooks/use-rag";
import { useAuthContext } from "@/providers/Auth";
import { useEffect } from "react";

type RagContextType = ReturnType<typeof useRag>;

const RagContext = createContext<RagContextType | null>(null);

export const RagProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const ragState = useRag();

  const { session } = useAuthContext();

  useEffect(() => {
    if (
      ragState.collections.length > 0 ||
      ragState.initialSearchExecuted ||
      !session?.accessToken
    ) {
      return;
    }
    ragState.initialFetch(session?.accessToken);
  }, [session?.accessToken]);

  return <RagContext.Provider value={ragState}>{children}</RagContext.Provider>;
};

export const useRagContext = () => {
  const context = useContext(RagContext);
  if (context === null) {
    throw new Error("useRagContext must be used within a RagProvider");
  }
  return context;
};
