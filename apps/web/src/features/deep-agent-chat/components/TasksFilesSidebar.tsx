"use client";

import React, { useMemo, useCallback, useState } from "react";
import { FileText, CheckCircle, Circle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OptimizationWindow } from "./OptimizationWindow";
import type { TodoItem, FileItem } from "../types";
import { Assistant } from "@langchain/langgraph-sdk";
import { useChatContext } from "../providers/ChatProvider";
import { cn } from "@/lib/utils";

interface TasksFilesSidebarProps {
  todos: TodoItem[];
  files: Record<string, string>;
  activeAssistant: Assistant | null;
  onFileClick: (file: FileItem) => void;
  assistantError: string | null;
  setAssistantError: (error: string | null) => void;
  setActiveAssistant: (assistant: Assistant | null) => void;
  threadId: string | null;
}

export const TasksFilesSidebar = React.memo<TasksFilesSidebarProps>(
  ({
    todos,
    files,
    activeAssistant,
    onFileClick,
    assistantError,
    setAssistantError,
    setActiveAssistant,
    threadId,
  }) => {
    const { messages } = useChatContext();
    const [isTrainingModeExpanded, setIsTrainingModeExpanded] = useState(false);

    const handleToggleTrainingMode = useCallback(() => {
      setIsTrainingModeExpanded((prev) => !prev);
    }, []);

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

    return (
      <div className="h-full w-[25vw]">
        <div className="bg-background border-border flex h-full w-full flex-col border-r">
          <Tabs
            defaultValue="tasks"
            className="mb-auto flex h-full flex-col overflow-hidden"
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
              </TabsList>
            </div>

            <TabsContent
              value="tasks"
              className="flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full">
                {todos.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-12 text-center">
                    <p className="text-tertiary">No tasks yet</p>
                  </div>
                ) : (
                  <div className="p-1">
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
                            <span className="flex-1 text-sm leading-relaxed break-words text-inherit">
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
                            <span className="flex-1 text-sm leading-relaxed break-words text-inherit">
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
                            <span className="flex-1 text-sm leading-relaxed break-words text-inherit">
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
              className="flex-1 overflow-hidden"
            >
              <ScrollArea className="h-full">
                {Object.keys(files).length === 0 ? (
                  <div className="flex h-full items-center justify-center p-12 text-center">
                    <p className="text-tertiary">No files yet</p>
                  </div>
                ) : (
                  <div className="p-1">
                    {Object.keys(files).map((file, index) => (
                      <div
                        key={file}
                        className="mb-1"
                      >
                        <div
                          className="flex cursor-pointer items-center gap-1.5 p-1.5 transition-colors"
                          onClick={() =>
                            onFileClick({ path: file, content: files[file] })
                          }
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
                          <span className="flex-1 text-sm leading-relaxed break-words text-inherit">
                            {file}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
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
