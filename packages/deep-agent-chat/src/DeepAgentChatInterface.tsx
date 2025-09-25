"use client";

import { useState } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { FilesPopover } from "./components/TasksFilesSidebar";
import type { TodoItem } from "./types";
import { Assistant } from "@langchain/langgraph-sdk";
import { ChatProvider } from "./providers/ChatProvider";
import { DeepAgentChatConfig } from "./types/config";
import { ClientProvider } from "./providers/ClientProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Button } from "./components/ui/button";

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
          <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-white">
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
              setFiles={setFiles}
              view={view}
              onViewChange={onViewChange}
              hideInternalToggle={hideInternalToggle}
              empty={empty}
              controls={
                <>
                  {controls}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                      >
                        Optimize
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent></PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                      >
                        Files
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <FilesPopover
                        files={files}
                        setFiles={setFiles}
                        editDisabled={false}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              }
            />
          </div>
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
