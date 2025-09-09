"use client";

import { useState } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { TasksFilesSidebar } from "./components/TasksFilesSidebar";
import { OptimizationSidebar } from "./components/OptimizationSidebar";
import { SubAgentPanel } from "./components/SubAgentPanel";
import type { SubAgent, TodoItem } from "./types";
import { Assistant } from "@langchain/langgraph-sdk";
import { ChatProvider } from "./providers/ChatProvider";
import { DeepAgentChatConfig } from "./types/config";
import { ClientProvider } from "./providers/ClientProvider";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";

function DeepAgentChatInterfaceInternal({
  assistantId,
  deploymentUrl,
  accessToken,
  optimizerDeploymentUrl,
  optimizerAccessToken,
}: DeepAgentChatConfig) {
  const [_, __setThreadId] = useQueryState("threadId");
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(
    null,
  );
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(
    null,
  );
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Note: new thread handler removed in this view; toggled workflow does not use it

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
        <div className="oap-deep-agent-chat absolute inset-0 flex h-screen gap-4 overflow-hidden p-4">
          <div className="border-border flex h-full flex-col rounded-xl border bg-white p-3">
            <OptimizationSidebar
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
              selectedSubAgent={selectedSubAgent}
              onSelectSubAgent={setSelectedSubAgent}
            />
            {selectedSubAgent && (
              <SubAgentPanel
                subAgent={selectedSubAgent}
                onClose={() => setSelectedSubAgent(null)}
              />
            )}
          </div>

          <TasksFilesSidebar
            todos={todos}
            files={files}
            setFiles={setFiles}
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
