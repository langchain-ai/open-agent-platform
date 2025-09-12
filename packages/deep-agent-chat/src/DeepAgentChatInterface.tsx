"use client";

import { useState } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { TasksFilesSidebar } from "./components/TasksFilesSidebar";
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
        <div className="oap-deep-agent-chat flex h-full w-full gap-4 overflow-hidden p-4">
          <div className="flex h-full w-[350px] flex-shrink-0 flex-col">
            <TasksFilesSidebar
              todos={todos}
              files={files}
              setFiles={setFiles}
              activeAssistant={activeAssistant}
              setActiveAssistant={setActiveAssistant}
              setAssistantError={setAssistantError}
              assistantError={assistantError}
            />
          </div>

          <div className="border-border flex min-h-0 flex-1 flex-col rounded-xl border bg-white p-3">
            <ChatInterface
              assistantId={assistantId}
              activeAssistant={activeAssistant}
              debugMode={debugMode}
              setDebugMode={setDebugMode}
              assistantError={assistantError}
              setAssistantError={setAssistantError}
              setActiveAssistant={setActiveAssistant}
              setTodos={setTodos}
              setFiles={setFiles}
              view={view}
              onViewChange={onViewChange}
              hideInternalToggle={hideInternalToggle}
            />
          </div>

          <TasksFilesSidebar
            todos={todos}
            files={files}
            setFiles={setFiles}
            activeAssistant={activeAssistant}
            setActiveAssistant={setActiveAssistant}
            setAssistantError={setAssistantError}
            assistantError={assistantError}
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
