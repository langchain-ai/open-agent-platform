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
import { Deployment } from "@/types/deployment";
import { getDeployments } from "@/lib/environment/deployments";
import { useAuthContext } from "@/providers/Auth";
import { deploymentSupportsDeepAgents } from "./utils";

export default function DeepAgentChatInterface() {
  const { session } = useAuthContext();

  const { agents, loading } = useAgentsContext();
  const deployments = getDeployments();
  const filteredAgents = agents.filter((agent) =>
    deploymentSupportsDeepAgents(
      deployments.find((d) => d.id === agent.deploymentId),
    ),
  );
  const [threadId, setThreadId] = useQueryState("threadId");
  const [agentId, setAgentId] = useQueryState("agentId");
  const [deploymentId, setDeploymentId] = useQueryState("deploymentId");

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(
    null,
  );
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

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

  const onNewThread = useCallback(() => {
    setThreadId(null);
    setSelectedSubAgent(null);
    setTodos([]);
    setFiles({});
  }, [setThreadId]);

  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!agentId || !deploymentId) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex min-h-64 max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Deep Agent Chat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to the Deep Agent chat! To continue, please select an
              agent to chat with.
            </p>
          </div>
          <div className="mb-24 grid grid-cols-[1fr_auto] gap-4 px-6 pt-4">
            <AgentsCombobox
              placeholder="Select a deep agent..."
              disableDeselect
              agents={filteredAgents}
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

  if (!session) {
    return (
      <div>
        <p>Please sign in to continue</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex h-full overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      <TasksFilesSidebar
        agentId={agentId}
        deploymentId={deploymentId}
        todos={todos}
        setTodos={setTodos}
        files={files}
        setFiles={setFiles}
        activeAssistant={activeAssistant}
        onFileClick={setSelectedFile}
        // onAssistantUpdate={refreshActiveAssistant}
        onAssistantUpdate={() => {
          throw new Error("Not implemented");
        }}
        assistantError={assistantError}
      />
      <div className="flex-1">
        <ChatInterface
          agentId={agentId}
          deploymentId={deploymentId}
          session={session}
          debugMode={debugMode}
          setDebugMode={setDebugMode}
          assistantError={assistantError}
          setAssistantError={setAssistantError}
          activeAssistant={activeAssistant}
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
      {selectedFile && (
        <FileViewDialog
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
