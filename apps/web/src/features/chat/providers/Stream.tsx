"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from "react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { ViIconSVG } from "@/components/icons/vi-icon";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
import { useAgentsContext } from "@/providers/Agents";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isUserSpecifiedDefaultAgent } from "@/lib/agent-utils";
import { useAuthContext } from "@/providers/Auth";
import { getDeployments } from "@/lib/environment/deployments";
import { useHasApiKeys } from "@/hooks/use-api-keys";
import { checkApiKeysWarning } from "@/lib/agent-utils";
import { useStreamWithRetry } from "@/features/chat/hooks/use-stream-with-retry";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

// Use the retry-wrapped stream hook to handle race conditions
// where the SDK polls for thread state before backend persistence completes
const useTypedStream = useStreamWithRetry;

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

  // Generate a stable session ID once per component instance (conversation)
  // This session ID persists for the lifetime of the conversation and is used
  // for MCP workspace session management, independent of the LangGraph threadId
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    sessionIdRef.current = `oap-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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
      // SESSION PERSISTENCE FIX: Use stable session ID for workspace tools
      // The sessionIdRef provides a stable identifier that persists for the entire
      // conversation lifetime, regardless of when the LangGraph threadId is set.
      // This session ID is forwarded by the OAP proxy to the langchain-tool-server
      // as the 'mcp-session-id' header, enabling persistent workspace state across
      // multiple tool calls within the same conversation.
      "X-OAP-Thread-ID": sessionIdRef.current,
    },
  });

  /**
   * REMOVED OPTIMIZATION ATTEMPT (Oct 20, 2025)
   *
   * Previously attempted to add visibility-based lifecycle management here to:
   * - Stop polling when tab goes to background (save resources)
   * - Remount component when tab returns to foreground ("clean restart")
   *
   * Implementation added:
   * - useEffect cleanup calling streamValue.stop() on unmount
   * - visibilitychange listener calling stop() when document.hidden
   * - Both with [streamValue] dependency
   *
   * FAILURE MODE:
   * - useEffect([streamValue]) created render loop (streamValue recreated each render)
   * - Caused repeated stop() calls
   * - Successfully loaded thread data would flash briefly then disappear
   * - Component remount triggered refetch which returned 404
   * - All 4 agents stuck in "Loading thread..." state
   *
   * OBSERVED SYMPTOMS:
   * - Thread history loads successfully (visible flash)
   * - Immediate remount destroys loaded state
   * - Second fetch returns 404 (likely due to rapid cancel/retry)
   * - Occurred on fresh page load AND after tab switching
   *
   * FOR FUTURE OPTIMIZATION:
   * - Do NOT remount the component (preserves loaded state)
   * - Do NOT use [streamValue] as dependency (creates loop)
   * - Consider: Just pause/resume polling without destroying component
   * - Consider: Use stable ref for streamValue instead of dependency
   * - Test: Ensure optimization doesn't affect thread history loading
   */

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

  /**
   * REMOVED OPTIMIZATION ATTEMPT (Oct 20, 2025)
   *
   * Previously attempted to add visibilityEpoch remounting here:
   * - State: const [visibilityEpoch, setVisibilityEpoch] = useState(0)
   * - Listener: Incremented epoch when tab became visible
   * - Key: <StreamSession key={`stream-${agentId}-${deploymentId}-${visibilityEpoch}`} />
   * - Memoization: Wrapped in React.memo()
   * - Ref: hasApiKeysRef to avoid hasApiKeys in dependency array
   *
   * FAILURE MODE:
   * - visibilitychange event fires during page navigation/load
   * - Epoch increment triggers React remount (new key)
   * - Destroys successfully loaded thread state
   * - New instance refetches but gets 404
   * - User sees flash (first successful load) then infinite "Loading thread..."
   *
   * WHY IT FAILED:
   * - Remounting destroys component state including loaded messages
   * - Browser visibilitychange events are unpredictable (fire during navigation)
   * - Second fetch after remount returns 404 (backend state issue from rapid cancel/retry)
   * - Optimization traded working functionality for resource saving
   *
   * FOR FUTURE OPTIMIZATION:
   * - Consider approaches that don't destroy loaded state
   * - Test thoroughly with thread history loading (not just active streaming)
   * - Ensure visibility events during page transitions don't break loading
   */

  useEffect(() => {
    if (value || !agents.length) {
      return;
    }
    const defaultAgent = agents.find(isUserSpecifiedDefaultAgent);
    if (defaultAgent) {
      setValue(`${defaultAgent.assistant_id}:${defaultAgent.deploymentId}`);
    }
  }, [agents]);

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
  };

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex min-h-64 max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 p-6">
            <div className="flex flex-col items-start gap-2">
              <ViIconSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Vi Builder
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Vi Builder's chat! To continue, please select an agent
              to chat with.
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
