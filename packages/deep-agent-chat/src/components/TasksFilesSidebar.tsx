"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  Circle,
  Clock,
  Plus,
  Copy,
  Edit,
  Save,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { OptimizationWindow } from "./OptimizationWindow";
import type { TodoItem, FileItem } from "../types";
import { Assistant } from "@langchain/langgraph-sdk";
import { useChatContext } from "../providers/ChatContext";
import { useQueryState } from "nuqs";
import { cn } from "../lib/utils";
import * as yaml from "js-yaml";
import { Button } from "./ui/button";
import { FileViewDialog } from "./FileViewDialog";
import { useClients } from "../providers/ClientProvider";
import { toast } from "sonner";

interface TasksFilesSidebarProps {
  todos: TodoItem[];
  files: Record<string, string>;
  activeAssistant: Assistant | null;
  setFiles: (files: Record<string, string>) => void;
  assistantError: string | null;
  setAssistantError: (error: string | null) => void;
  setActiveAssistant: (assistant: Assistant | null) => void;
}

export const TasksFilesSidebar = React.memo<TasksFilesSidebarProps>(
  ({
    todos,
    files,
    activeAssistant,
    setFiles,
    assistantError,
    setAssistantError,
    setActiveAssistant,
  }) => {
    const [threadId] = useQueryState("threadId");
    const { messages, isLoading, interrupt } = useChatContext();
    const [isTrainingModeExpanded, setIsTrainingModeExpanded] = useState(false);
    const [isFileCreationDialogOpen, setIsFileCreationDialogOpen] =
      useState(false);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [isEditingConfig, setIsEditingConfig] = useState(false);
    const [editedConfig, setEditedConfig] = useState<string>(() =>
      activeAssistant?.config?.configurable
        ? yaml.dump(activeAssistant.config.configurable, {
            indent: 2,
            lineWidth: -1,
          })
        : "",
    );

    const { client } = useClients();

    const handleClickCreateButton = useCallback(() => {
      setSelectedFile(null);
      setIsFileCreationDialogOpen(true);
    }, []);

    const handleCloseFileDialog = useCallback(() => {
      setIsFileCreationDialogOpen(false);
    }, []);

    const handleSaveFile = useCallback(
      (fileName: string, content: string) => {
        const newFiles = {
          ...files,
          [fileName]: content,
        };
        setFiles(newFiles);
        setSelectedFile({ path: fileName, content: content });
      },
      [files, setFiles],
    );

    useEffect(() => {
      if (activeAssistant?.config?.configurable) {
        setEditedConfig(
          yaml.dump(activeAssistant.config.configurable, {
            indent: 2,
            lineWidth: -1,
          }),
        );
      }
    }, [activeAssistant?.config?.configurable]);

    const handleToggleTrainingMode = useCallback(() => {
      setIsTrainingModeExpanded((prev) => !prev);
    }, []);

    const handleCopyConfig = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(editedConfig);
      } catch (err) {
        console.error("Failed to copy config:", err);
      }
    }, [editedConfig]);

    const handleEditConfig = useCallback(() => {
      setIsEditingConfig(true);
    }, []);

    const handleCancelEdit = useCallback(() => {
      setIsEditingConfig(false);
      if (activeAssistant?.config?.configurable) {
        setEditedConfig(
          yaml.dump(activeAssistant.config.configurable, {
            indent: 2,
            lineWidth: -1,
          }),
        );
      }
    }, [activeAssistant?.config?.configurable]);

    const handleSaveConfig = useCallback(async () => {
      if (activeAssistant && client) {
        await client.assistants.update(activeAssistant.assistant_id, {
          metadata: activeAssistant.metadata,
          config: {
            configurable: yaml.load(editedConfig) as Record<string, unknown>,
          },
        });
        setIsEditingConfig(false);
        setAssistantError(null);
        try {
          const assistant = await client.assistants.get(
            activeAssistant.assistant_id,
          );

          setActiveAssistant(assistant);
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
      }
    }, [
      activeAssistant,
      client,
      editedConfig,
      setActiveAssistant,
      setAssistantError,
    ]);

    const getStatusIcon = useCallback((status: TodoItem["status"]) => {
      switch (status) {
        case "completed":
          return (
            <CheckCircle
              size={16}
              className="text-success"
            />
          );
        case "in_progress":
          return (
            <Clock
              size={16}
              className="text-warning"
            />
          );
        default:
          return (
            <Circle
              size={16}
              className="text-tertiary"
            />
          );
      }
    }, []);

    const groupedTodos = useMemo(() => {
      return {
        pending: todos.filter((t) => t.status === "pending"),
        in_progress: todos.filter((t) => t.status === "in_progress"),
        completed: todos.filter((t) => t.status === "completed"),
      };
    }, [todos]);

    const tabTriggerStyles =
      "h-10 p-1 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-black/5 data-[state=inactive]:hover:text-primary transition-colors duration-200 ease-in-out";

    const createdAtDate = useMemo(() => {
      if (!activeAssistant?.created_at) return null;
      return new Date(
        activeAssistant.created_at as string | number | Date,
      ).toLocaleString();
    }, [activeAssistant?.created_at]);

    const updatedAtDate = useMemo(() => {
      if (!activeAssistant?.updated_at) return null;
      return new Date(
        activeAssistant.updated_at as string | number | Date,
      ).toLocaleString();
    }, [activeAssistant?.updated_at]);

    return (
      <div className="min-h-0 w-[25vw] flex-1">
        <div className="bg-background border-border flex h-full w-full flex-col border-r">
          <Tabs
            defaultValue="tasks"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2">
              <TabsList className="bg-background m-4 flex h-full w-full justify-stretch gap-2 rounded-md p-1">
                <TabsTrigger
                  value="tasks"
                  className={cn(tabTriggerStyles)}
                >
                  Tasks ({todos.length})
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className={cn(tabTriggerStyles)}
                >
                  Files ({Object.keys(files).length})
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  className={cn(tabTriggerStyles)}
                >
                  Configuration
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="tasks"
              className="overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col"
            >
              <ScrollArea className="h-full">
                {todos.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-12 text-center">
                    <p className="text-tertiary">No tasks yet</p>
                  </div>
                ) : (
                  <div className="ml-4 p-1">
                    {groupedTodos.in_progress.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-tertiary mb-1 text-xs font-semibold uppercase">
                          In Progress
                        </h3>
                        {groupedTodos.in_progress.map((todo, index) => (
                          <div
                            key={`in_progress_${todo.id}_${index}`}
                            className="mb-1 flex items-start gap-1.5 rounded-md p-1.5 transition-colors"
                          >
                            {getStatusIcon(todo.status)}
                            <span className="flex-1 break-words text-sm leading-relaxed text-inherit">
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.pending.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-tertiary mb-1 text-xs font-semibold uppercase">
                          Pending
                        </h3>
                        {groupedTodos.pending.map((todo, index) => (
                          <div
                            key={`pending_${todo.id}_${index}`}
                            className="mb-1 flex items-start gap-1.5 rounded-md p-1.5 transition-colors"
                          >
                            {getStatusIcon(todo.status)}
                            <span className="flex-1 break-words text-sm leading-relaxed text-inherit">
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.completed.length > 0 && (
                      <div className="mb-0">
                        <h3 className="text-tertiary mb-1 text-xs font-semibold uppercase">
                          Completed
                        </h3>
                        {groupedTodos.completed.map((todo, index) => (
                          <div
                            key={`completed_${todo.id}_${index}`}
                            className="mb-1 flex items-start gap-1.5 rounded-md p-1.5 transition-colors"
                          >
                            {getStatusIcon(todo.status)}
                            <span className="flex-1 break-words text-sm leading-relaxed text-inherit">
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent
              value="files"
              className="overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col"
            >
              <div className="flex justify-end px-5 py-1">
                <Button
                  onClick={handleClickCreateButton}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3"
                  disabled={isLoading === true || interrupt !== undefined}
                >
                  <Plus
                    size={16}
                    className="mr-1"
                  />
                  Create New File
                </Button>
              </div>
              <ScrollArea className="h-full">
                {Object.keys(files).length === 0 ? (
                  <div className="flex h-full items-center justify-center p-12 text-center">
                    <p className="text-tertiary">No files yet</p>
                  </div>
                ) : (
                  <div className="p-1">
                    {Object.keys(files).map((file) => (
                      <div
                        key={file}
                        className="mb-1"
                      >
                        <div
                          className="flex cursor-pointer items-center gap-1.5 p-1.5 transition-colors"
                          onClick={() => {
                            setSelectedFile({
                              path: file,
                              content: files[file],
                            });
                            setIsFileCreationDialogOpen(true);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--color-border-light)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <FileText
                            size={16}
                            className="text-tertiary flex-shrink-0"
                          />
                          <span className="flex-1 break-words text-sm leading-relaxed text-inherit">
                            {file}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {isFileCreationDialogOpen && (
                <FileViewDialog
                  file={selectedFile}
                  onSaveFile={handleSaveFile}
                  onClose={handleCloseFileDialog}
                  editDisabled={isLoading === true || interrupt !== undefined}
                />
              )}
            </TabsContent>
            <TabsContent
              value="config"
              className="overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col"
            >
              <div className="flex flex-shrink-0 items-center justify-between gap-2 px-5 py-1">
                <div className="flex-1 truncate">
                  {activeAssistant && (
                    <>
                      <div className="text-primary text-lg font-medium">
                        {activeAssistant.name || activeAssistant.assistant_id}
                        {activeAssistant.version && (
                          <span className="text-tertiary ml-1">
                            v{activeAssistant.version}
                          </span>
                        )}
                      </div>
                      <div>
                        {activeAssistant.created_at ? (
                          <span className="text-tertiary text-xs">
                            Created: {createdAtDate}
                          </span>
                        ) : null}
                      </div>
                      <div>
                        {activeAssistant.updated_at ? (
                          <span className="text-tertiary text-xs">
                            Updated: {updatedAtDate}
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-1">
                  {!isEditingConfig ? (
                    <>
                      <Button
                        onClick={handleEditConfig}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={
                          !activeAssistant ||
                          assistantError !== null ||
                          !activeAssistant?.config?.configurable
                        }
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        onClick={handleCopyConfig}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        disabled={!editedConfig}
                      >
                        <Copy size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSaveConfig}
                        size="sm"
                        variant="default"
                        className="h-7 px-2 text-xs"
                      >
                        <Save
                          size={14}
                          className="mr-1"
                        />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {!activeAssistant || assistantError ? (
                <div className="text-tertiary flex flex-1 items-center justify-center p-8 text-center">
                  <p className="m-0 text-sm">
                    {assistantError
                      ? "Failed to load agent config"
                      : "No agent loaded"}
                  </p>
                </div>
              ) : !isEditingConfig ? (
                <ScrollArea className="min-h-0 w-full flex-1">
                  <div className="p-4 pt-2">
                    <div className="border-border text-primary whitespace-pre-wrap break-words rounded-lg border bg-white p-4 font-mono text-xs leading-relaxed">
                      {editedConfig}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col p-4 pt-2">
                  <textarea
                    value={editedConfig}
                    onChange={(e) => setEditedConfig(e.target.value)}
                    className="border-border text-primary focus:ring-primary w-full flex-1 resize-none rounded-lg border bg-white p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2"
                    placeholder="Enter YAML configuration..."
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
          {activeAssistant && !assistantError && (
            <OptimizationWindow
              threadId={threadId}
              deepAgentMessages={messages}
              isExpanded={isTrainingModeExpanded}
              onToggle={handleToggleTrainingMode}
              activeAssistant={activeAssistant}
              setActiveAssistant={setActiveAssistant}
              setAssistantError={setAssistantError}
            />
          )}
        </div>
      </div>
    );
  },
);

TasksFilesSidebar.displayName = "TasksFilesSidebar";
