"use client";

import { useState, useCallback } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { TasksFilesSidebar } from "./components/TasksFilesSidebar";
import { SubAgentPanel } from "./components/SubAgentPanel";
import type { SubAgent, TodoItem } from "./types";
import { Assistant } from "@langchain/langgraph-sdk";
import { ChatProvider } from "./providers/ChatProvider";
import { DeepAgentChatConfig } from "./types/config";
import { ClientProvider } from "./providers/ClientProvider";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";

function DeepAgentChatInterfaceCore({
  assistantId,
  deploymentUrl,
  accessToken,
  optimizerDeploymentUrl,
  optimizerAccessToken,
  mode = 'standalone',
  // Optional OAP-specific components (injected by OAP wrapper)
  SidebarTrigger,
  DeepAgentChatBreadcrumb
}: DeepAgentChatConfig) {
  const [_, setThreadId] = useQueryState("threadId");
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

  const onNewThread = useCallback(() => {
    setThreadId(null);
    setSelectedSubAgent(null);
    setTodos([]);
    setFiles({});
  }, [setThreadId]);

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
          <div className="absolute inset-0 flex h-screen overflow-hidden">
            <div className="flex h-full flex-col">
              {mode === 'oap' && (
                <header className="flex h-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                  <div className="flex items-center gap-2 px-4">
                    {SidebarTrigger && <SidebarTrigger className="-ml-1" />}
                    {DeepAgentChatBreadcrumb && <DeepAgentChatBreadcrumb />}
                  </div>
                </header>
              )}
              <TasksFilesSidebar
                todos={todos}
                files={files}
                activeAssistant={activeAssistant}
                setFiles={setFiles}
                setActiveAssistant={setActiveAssistant}
                setAssistantError={setAssistantError}
                assistantError={assistantError}
              />
            </div>

            <div className="flex-1">
              <ChatInterface
                assistantId={assistantId}
                debugMode={debugMode}
                setDebugMode={setDebugMode}
                assistantError={assistantError}
                setAssistantError={setAssistantError}
                setActiveAssistant={setActiveAssistant}
                setTodos={setTodos}
                setFiles={setFiles}
                selectedSubAgent={selectedSubAgent}
                onSelectSubAgent={setSelectedSubAgent}
                onNewThread={onNewThread}
              />
              {selectedSubAgent && (
                <SubAgentPanel
                  subAgent={selectedSubAgent}
                  onClose={() => setSelectedSubAgent(null)}
                />
              )}
            </div>
          </div>
        </ChatProvider>
      </ClientProvider>
  );
}

export default function DeepAgentChatInterface(props: DeepAgentChatConfig) {
  return (
    <NuqsAdapter>
      <DeepAgentChatInterfaceCore {...props} />
    </NuqsAdapter>
  );
}