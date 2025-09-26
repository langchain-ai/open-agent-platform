"use client";

import { useState } from "react";
import { ChatInterface } from "./components/ChatInterface";
import type { TodoItem } from "./types";
import { Assistant } from "@langchain/langgraph-sdk";
import { ChatProvider } from "./providers/ChatProvider";
import { DeepAgentChatConfig } from "./types/config";
import { ClientProvider } from "./providers/ClientProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

function DeepAgentChatInterfaceInternal({
  assistantId,
  deploymentUrl,
  accessToken,
  optimizerDeploymentUrl,
  optimizerAccessToken,
  view,
  onViewChange,
  hideInternalToggle,
  controls,
  empty,
}: DeepAgentChatConfig) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(
    null,
  );
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  return (
    <ClientProvider
      deploymentUrl={deploymentUrl}
      accessToken={accessToken}
      optimizerUrl={optimizerDeploymentUrl}
      optimizerAccessToken={optimizerAccessToken}
    >
      <ChatProvider
        setTodos={setTodos}
        files={files}
        setFiles={setFiles}
        activeAssistant={activeAssistant}
        assistantId={assistantId}
      >
        <div className="oap-deep-agent-chat flex h-full w-full gap-4 overflow-hidden">
          <ChatInterface
            assistantId={assistantId}
            activeAssistant={activeAssistant}
            debugMode={debugMode}
            setDebugMode={setDebugMode}
            assistantError={assistantError}
            setAssistantError={setAssistantError}
            setActiveAssistant={setActiveAssistant}
            todos={todos}
            setTodos={setTodos}
            files={files}
            setFiles={setFiles}
            view={view}
            onViewChange={onViewChange}
            hideInternalToggle={hideInternalToggle}
            empty={empty}
            controls={controls}
          />
        </div>
      </ChatProvider>
    </ClientProvider>
  );
}

export function DeepAgentChatInterface(props: DeepAgentChatConfig) {
  return (
    <NuqsAdapter>
      <DeepAgentChatInterfaceInternal {...props} />
    </NuqsAdapter>
  );
}
