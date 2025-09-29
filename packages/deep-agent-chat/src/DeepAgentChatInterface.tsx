"use client";

import { useState } from "react";
import { ChatInterface } from "./components/ChatInterface";
import type { TodoItem } from "./types";
import { ChatProvider } from "./providers/ChatProvider";
import { DeepAgentChatConfig } from "./types/config";
import { ClientProvider } from "./providers/ClientProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

function DeepAgentChatInterfaceInternal({
  assistant,
  deploymentUrl,
  accessToken,
  optimizerDeploymentUrl,
  optimizerAccessToken,
  view,
  onInput,
  onViewChange,
  hideInternalToggle,
  controls,
  empty,
}: DeepAgentChatConfig) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
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
        activeAssistant={assistant}
      >
        <div className="oap-deep-agent-chat flex h-full w-full gap-4 overflow-hidden">
          <ChatInterface
            assistant={assistant}
            debugMode={debugMode}
            setDebugMode={setDebugMode}
            todos={todos}
            setTodos={setTodos}
            files={files}
            setFiles={setFiles}
            view={view}
            onViewChange={onViewChange}
            onInput={onInput}
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
