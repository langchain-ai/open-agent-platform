"use client";

import React, { useMemo, useCallback, useState } from "react";
import { FileText, CheckCircle, Circle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OptimizationWindow } from "./OptimizationWindow";
import type { TodoItem, FileItem } from "../types";
import { Assistant, Message } from "@langchain/langgraph-sdk";

interface TasksFilesSidebarProps {
  threadId: string | null;
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
  activeAssistant: Assistant | null;
  onFileClick: (file: FileItem) => void;
  onAssistantUpdate: () => void;
  assistantError: string | null;
}

export const TasksFilesSidebar = React.memo<TasksFilesSidebarProps>(
  ({
    threadId,
    messages,
    todos,
    files,
    activeAssistant,
    onFileClick,
    onAssistantUpdate,
    assistantError,
  }) => {
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
              style={{
                color: "var(--color-success)",
                flexShrink: 0,
              }}
            />
          );
        case "in_progress":
          return (
            <Clock
              size={16}
              style={{
                color: "var(--color-warning)",
                flexShrink: 0,
              }}
            />
          );
        default:
          return (
            <Circle
              size={16}
              style={{
                color: "var(--color-text-tertiary)",
                flexShrink: 0,
              }}
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

    return (
      <div
        style={{
          width: "25vw", // $sidebar-width
          height: "100%",
          position: "relative",
          flexShrink: 0,
          paddingTop: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-surface)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <Tabs
            defaultValue="tasks"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.25rem 1rem",
              }}
            >
              <TabsList
                style={{
                  margin: "1rem",
                  backgroundColor: "var(--color-border-light)",
                  display: "flex",
                  gap: "0.5rem",
                  padding: "0.25rem",
                  borderRadius: "0.375rem",
                  width: "calc(100% - 2rem)",
                  height: "auto",
                  justifyContent: "stretch",
                }}
              >
                <TabsTrigger
                  value="tasks"
                  style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.25rem",
                    transition: "all 200ms ease",
                  }}
                  className="data-[state=active]:!bg-[var(--color-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:bg-black/5 data-[state=inactive]:hover:text-[var(--color-text-primary)]"
                >
                  Tasks ({todos.length})
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.25rem",
                    transition: "all 200ms ease",
                  }}
                  className="data-[state=active]:!bg-[var(--color-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:bg-black/5 data-[state=inactive]:hover:text-[var(--color-text-primary)]"
                >
                  Files ({Object.keys(files).length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="tasks"
              style={{
                flex: 1,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <ScrollArea style={{ height: "100%" }}>
                {todos.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      No tasks yet
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "1rem" }}>
                    {groupedTodos.in_progress.length > 0 && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h3
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                          }}
                        >
                          In Progress
                        </h3>
                        {groupedTodos.in_progress.map((todo, index) => (
                          <div
                            key={`in_progress_${todo.id}_${index}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              marginBottom: "0.25rem",
                              transition: "background-color 200ms ease",
                            }}
                          >
                            {getStatusIcon(todo.status)}
                            <span
                              style={{
                                flex: 1,
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.pending.length > 0 && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h3
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Pending
                        </h3>
                        {groupedTodos.pending.map((todo, index) => (
                          <div
                            key={`pending_${todo.id}_${index}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              marginBottom: "0.25rem",
                              transition: "background-color 200ms ease",
                            }}
                          >
                            {getStatusIcon(todo.status)}
                            <span
                              style={{
                                flex: 1,
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.completed.length > 0 && (
                      <div style={{ marginBottom: 0 }}>
                        <h3
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Completed
                        </h3>
                        {groupedTodos.completed.map((todo, index) => (
                          <div
                            key={`completed_${todo.id}_${index}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              marginBottom:
                                index === groupedTodos.completed.length - 1
                                  ? 0
                                  : "0.25rem",
                              transition: "background-color 200ms ease",
                            }}
                          >
                            {getStatusIcon(todo.status)}
                            <span
                              style={{
                                flex: 1,
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                color: "var(--color-text-primary)",
                              }}
                            >
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
              style={{
                flex: 1,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <ScrollArea style={{ height: "100%" }}>
                {Object.keys(files).length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      No files yet
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "1rem" }}>
                    {Object.keys(files).map((file, index) => (
                      <div
                        key={file}
                        style={{
                          width: "100%",
                          marginBottom:
                            index === Object.keys(files).length - 1
                              ? 0
                              : "0.25rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.25rem 0.5rem",
                            cursor: "pointer",
                            transition: "background-color 200ms ease",
                          }}
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
                            style={{
                              flexShrink: 0,
                              color: "var(--color-text-secondary)",
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: "0.875rem",
                              color: "var(--color-text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
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
              onAssistantUpdate={onAssistantUpdate}
            />
          )}
        </div>
      </div>
    );
  },
);

TasksFilesSidebar.displayName = "TasksFilesSidebar";
