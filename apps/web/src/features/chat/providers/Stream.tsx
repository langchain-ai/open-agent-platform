"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
import { useAgentsContext } from "@/providers/Agents";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isUserSpecifiedDefaultAgent } from "@/lib/agent-utils";
import { useAuthContext } from "@/providers/Auth";
import { getDeployments } from "@/lib/environment/deployments";
import { useHasApiKeys } from "@/hooks/use-api-keys";
import { checkApiKeysWarning } from "@/lib/agent-utils";
import { useLastSelectedAgent } from "@/hooks/use-last-selected-agent";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

const StreamSession = ({
  children,
  agentId,
  deploymentId,
  accessToken,
  useProxyRoute,
}: {
  children: ReactNode;
  agentId: string;
  deploymentId: string;
  accessToken?: string;
  useProxyRoute?: boolean;
}) => {
  if (!useProxyRoute && !accessToken) {
    toast.error("Access token must be provided if not using proxy route");
  }

  const deployment = getDeployments().find((d) => d.id === deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  let deploymentUrl = deployment.deploymentUrl;
  if (useProxyRoute) {
    const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;
    if (!baseApiUrl) {
      throw new Error(
        "Failed to create client: Base API URL not configured. Please set NEXT_PUBLIC_BASE_API_URL",
      );
    }
    deploymentUrl = `${baseApiUrl}/langgraph/proxy/${deploymentId}`;
  }

  const [threadId, setThreadId] = useQueryState("threadId");
  const streamValue = useTypedStream({
    apiUrl: deploymentUrl,
    assistantId: agentId,
    threadId: threadId ?? null,
    onCustomEvent: (event, options) => {
      options.mutate((prev) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui };
      });
    },
    onThreadId: (id) => {
      setThreadId(id);
    },
    defaultHeaders: {
      ...(!useProxyRoute
        ? {
            Authorization: `Bearer ${accessToken}`,
            "x-supabase-access-token": accessToken,
          }
        : {
            "x-auth-scheme": "langsmith",
          }),
    },
  });

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { agents, loading } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const { session } = useAuthContext();
  const hasApiKeys = useHasApiKeys();
  const warningShownRef = useRef<string>("");
  const [lastSelectedAgent, setLastSelectedAgent] = useLastSelectedAgent();

  useEffect(() => {
    if (value || !agents.length) {
      return;
    }
    
    // First, try to use the last selected agent from local storage
    if (lastSelectedAgent) {
      const [storedAgentId, storedDeploymentId] = lastSelectedAgent.split(":");
      // Verify the stored agent still exists in the current agents list
      const storedAgent = agents.find(
        (agent) => agent.assistant_id === storedAgentId && agent.deploymentId === storedDeploymentId
      );
      if (storedAgent) {
        setValue(lastSelectedAgent);
        return;
      }
    }
    
    // Fallback to default agent if no last selected agent or it doesn't exist anymore
    const defaultAgent = agents.find(isUserSpecifiedDefaultAgent);
    if (defaultAgent) {
      setValue(`${defaultAgent.assistant_id}:${defaultAgent.deploymentId}`);
    }
  }, [agents, lastSelectedAgent]);

  useEffect(() => {
    if (agentId && deploymentId) {
      const currentKey = `${agentId}:${deploymentId}`;
      if (warningShownRef.current !== currentKey) {
        checkApiKeysWarning(deploymentId, hasApiKeys);
        warningShownRef.current = currentKey;
      }
    }
  }, [agentId, deploymentId, hasApiKeys]);

  const handleValueChange = (v: string) => {
    setValue(v);
    setOpen(false);
  };

  const handleStartChat = () => {
    if (!value) {
      toast.info("Please select an agent");
      return;
    }
    const [agentId_, deploymentId_] = value.split(":");
    setAgentId(agentId_);
    setDeploymentId(deploymentId_);
    
    // Save the selected agent to local storage
    setLastSelectedAgent(value);
  };

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex min-h-64 max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Open Agent Platform
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Open Agent Platform's chat! To continue, please select
              an agent to chat with.
            </p>
          </div>
          <div className="mb-24 grid grid-cols-[1fr_auto] gap-4 px-6 pt-4">
            <AgentsCombobox
              disableDeselect
              agents={agents}
              agentsLoading={loading}
              value={value}
              setValue={(v) =>
                Array.isArray(v)
                  ? handleValueChange(v[0])
                  : handleValueChange(v)
              }
              open={open}
              setOpen={setOpen}
            />
            <Button onClick={handleStartChat}>Start Chat</Button>
          </div>
        </div>
      </div>
    );
  }

  const useProxyRoute = process.env.NEXT_PUBLIC_USE_LANGSMITH_AUTH === "true";
  if (!useProxyRoute && !session?.accessToken) {
    toast.error("Access token must be provided if not using proxy route");
    return null;
  }

  return (
    <StreamSession
      agentId={agentId}
      deploymentId={deploymentId}
      accessToken={session?.accessToken ?? undefined}
      useProxyRoute={useProxyRoute}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
