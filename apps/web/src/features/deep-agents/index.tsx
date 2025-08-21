"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { ChatInterface } from "./components/ChatInterface";
import { TasksFilesSidebar } from "./components/TasksFilesSidebar";
import { SubAgentPanel } from "./components/SubAgentPanel";
import { FileViewDialog } from "./components/FileViewDialog";
import { createClient } from "@/lib/client";
import type { SubAgent, FileItem, TodoItem } from "./types";
import { Assistant } from "@langchain/langgraph-sdk";
import { useChat } from "./hooks/useChat";
import { toast } from "sonner";
import { useAgentsContext } from "@/providers/Agents";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { AgentsCombobox } from "@/components/ui/agents-combobox";
import { Button } from "@/components/ui/button";

export default function DeepAgentsInterface() {
  const { agents, loading } = useAgentsContext();
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");
  const [threadId, setThreadId] = useQueryState("threadId");

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(
    null,
  );
  const [debugMode, setDebugMode] = useState(true);
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  const client = useMemo(() => {
    if (!deploymentId) return null;
    return createClient(deploymentId);
  }, [deploymentId]);

  const refreshActiveAssistant = useCallback(async () => {
    if (!agentId || !deploymentId || !client) {
      setActiveAssistant(null);
      setAssistantError(null);
      return;
    }
    setAssistantError(null);
    try {
      const assistant = await client.assistants.get(agentId);
      setActiveAssistant(assistant);
      setAssistantError(null);
      toast.dismiss();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setActiveAssistant(null);
      setAssistantError(errorMessage);
      toast.dismiss();
      toast.error("Failed to load assistant", {
        description: `Could not connect to assistant: ${errorMessage}`,
        duration: 50000,
      });
    }
  }, [client, agentId, deploymentId]);

  useEffect(() => {
    refreshActiveAssistant();
  }, [refreshActiveAssistant]);

  // When the threadId changes, grab the thread state from the graph server
  useEffect(() => {
    const fetchThreadState = async () => {
      if (!threadId || !client) {
        setTodos([]);
        setFiles({});
        setIsLoadingThreadState(false);
        return;
      }
      setIsLoadingThreadState(true);
      try {
        const state = await client.threads.getState(threadId);
        if (state.values) {
          const currentState = state.values as {
            todos?: TodoItem[];
            files?: Record<string, string>;
          };
          setTodos(currentState.todos || []);
          setFiles(currentState.files || {});
        }
      } catch (error) {
        console.error("Failed to fetch thread state:", error);
        setTodos([]);
        setFiles({});
      } finally {
        setIsLoadingThreadState(false);
      }
    };
    fetchThreadState();
  }, [threadId, client]);

  const handleNewThread = useCallback(() => {
    setThreadId(null);
    setSelectedSubAgent(null);
    setTodos([]);
    setFiles({});
  }, [setThreadId]);

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

  const {
    messages,
    isLoading,
    interrupt,
    getMessagesMetadata,
    sendMessage,
    runSingleStep,
    continueStream,
    stopStream,
  } = useChat(
    threadId,
    setThreadId,
    setTodos,
    setFiles,
    activeAssistant,
    deploymentId,
    agentId,
  );

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex min-h-64 max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Deep Agents
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to the Deep Agent chat! To continue, please select an
              agent to chat with.
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

  return (
    <div className="absolute inset-0 flex h-full overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      <TasksFilesSidebar
        threadId={threadId}
        messages={messages}
        todos={todos}
        files={files}
        activeAssistant={activeAssistant}
        onFileClick={setSelectedFile}
        onAssistantUpdate={refreshActiveAssistant}
        assistantError={assistantError}
      />
      <div className="flex-1">
        <ChatInterface
          threadId={threadId}
          messages={messages}
          isLoading={isLoading}
          sendMessage={sendMessage}
          stopStream={stopStream}
          getMessagesMetadata={getMessagesMetadata}
          selectedSubAgent={selectedSubAgent}
          setThreadId={setThreadId}
          onSelectSubAgent={setSelectedSubAgent}
          onNewThread={handleNewThread}
          isLoadingThreadState={isLoadingThreadState}
          debugMode={debugMode}
          setDebugMode={setDebugMode}
          runSingleStep={runSingleStep}
          continueStream={continueStream}
          interrupt={interrupt}
          assistantError={assistantError}
        />
        {selectedSubAgent && (
          <SubAgentPanel
            subAgent={selectedSubAgent}
            onClose={() => setSelectedSubAgent(null)}
          />
        )}
      </div>
      {selectedFile && (
        <FileViewDialog
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
