"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ConfigDialog } from "@/components/ConfigDialog";
import { getConfig, saveConfig, StandaloneConfig } from "@/lib/config";
import { ClientProvider } from "@/providers/ClientProvider";
import { ChatProvider } from "@/features/agent-chat/providers/ChatProvider";
import { ChatInterface } from "@/features/agent-chat/components/ChatInterface";
import { Settings, MessagesSquare } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useQueryState } from "nuqs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ThreadList } from "@/components/ThreadList";

function PageContent() {
  const [config, setConfig] = useState<StandaloneConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [agentId, setAgentId] = useQueryState("agentId");
  const [_threadId, setThreadId] = useQueryState("threadId");
  const [sidebar, setSidebar] = useQueryState("sidebar");

  useEffect(() => {
    const savedConfig = getConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      // Set agentId in URL for inbox to work
      if (!agentId) {
        setAgentId(savedConfig.assistantId);
      }
    } else {
      setConfigDialogOpen(true);
    }
  }, []);

  // Update agentId when config changes
  useEffect(() => {
    if (config && !agentId) {
      setAgentId(config.assistantId);
    }
  }, [config, agentId, setAgentId]);

  const handleSaveConfig = (newConfig: StandaloneConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  };

  const apiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "";

  if (!apiKey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Missing API Key
          </h1>
          <p className="mt-2 text-muted-foreground">
            Please set NEXT_PUBLIC_LANGSMITH_API_KEY in your environment
            variables
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <>
        <ConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          onSave={handleSaveConfig}
        />
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome to Standalone Chat</h1>
            <p className="mt-2 text-muted-foreground">
              Configure your deployment to get started
            </p>
            <Button
              onClick={() => setConfigDialogOpen(true)}
              className="mt-4"
            >
              Open Configuration
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Create a mock Agent object from config
  const assistant: Agent = {
    assistant_id: config.assistantId,
    graph_id: config.assistantId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    config: {},
    metadata: {},
    version: 1,
    name: "Assistant",
    context: "standalone",
    deploymentId: "standalone",
  };

  return (
    <>
      <ConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onSave={handleSaveConfig}
        initialConfig={config}
      />
      <ClientProvider deploymentUrl={config.deploymentUrl} apiKey={apiKey}>
        <div className="flex h-screen flex-col">
              <header className="flex h-16 items-center justify-between border-b px-6">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold">Deep Agent UI</h1>
                  {!sidebar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebar("1")}
                      className="shadow-icon-button rounded-md border border-gray-300 bg-white p-3 text-gray-700 hover:bg-gray-100"
                    >
                      <MessagesSquare className="mr-2 h-4 w-4" />
                      Threads
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {config && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Assistant:</span>{" "}
                      {config.assistantId}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfigDialogOpen(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </header>

              <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup
                  direction="horizontal"
                  autoSaveId="standalone-chat"
                >
                  {sidebar && (
                    <>
                      <ResizablePanel
                        id="thread-history"
                        order={1}
                        defaultSize={30}
                        className="relative"
                      >
                        <div className="absolute inset-0 grid grid-rows-[auto_1fr]">
                          <div className="flex items-center justify-between p-4 px-[18px]">
                            <h2 className="flex items-center gap-4 text-lg font-semibold">
                              Threads
                            </h2>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSidebar(null)}
                              className="text-sm"
                            >
                              Close
                            </Button>
                          </div>
                          <div className="overflow-hidden">
                            <ThreadList
                              onThreadSelect={async (id) => {
                                await setThreadId(id);
                              }}
                            />
                          </div>
                        </div>
                      </ResizablePanel>
                      <ResizableHandle />
                    </>
                  )}

                  <ResizablePanel id="chat" className="relative flex flex-col" order={2}>
                    <ChatProvider
                      activeAssistant={assistant}
                      onHistoryRevalidate={() => {}}
                    >
                      <ChatInterface
                        assistant={assistant}
                        debugMode={debugMode}
                        setDebugMode={setDebugMode}
                        controls={<></>}
                        empty={
                          <div className="flex-grow-3 flex items-center justify-center">
                            <p className="text-muted-foreground">
                              Start a conversation...
                            </p>
                          </div>
                        }
                        skeleton={
                          <div className="flex items-center justify-center p-8">
                            <p className="text-muted-foreground">Loading...</p>
                          </div>
                        }
                      />
                    </ChatProvider>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
        </div>
      </ClientProvider>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
