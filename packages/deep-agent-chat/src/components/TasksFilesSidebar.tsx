"use client";

import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  FileText,
  CheckCircle,
  Circle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import type { TodoItem, FileItem } from "../types";
import { useChatContext } from "../providers/ChatProvider";
import { cn } from "../lib/utils";
import { FileViewDialog } from "./FileViewDialog";
import { OptimizationSidebar } from "./OptimizationSidebar";
import type { Assistant } from "@langchain/langgraph-sdk";

interface TasksFilesSidebarProps {
  todos: TodoItem[];
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => void;
  activeAssistant: Assistant | null;
  setActiveAssistant: (assistant: Assistant | null) => void;
  setAssistantError: (error: string | null) => void;
  assistantError: string | null;
}

export function FilesPopover(props: {
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => void;
  editDisabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const handleSaveFile = useCallback(
    (fileName: string, content: string) => {
      const newFiles = {
        ...props.files,
        [fileName]: content,
      };
      props.setFiles(newFiles);
      setSelectedFile({ path: fileName, content: content });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.files, props.setFiles],
  );

  return (
    <>
      {Object.keys(props.files).length === 0 ? (
        <div className="flex h-full items-center justify-center p-4 text-center">
          <p className="text-muted-foreground text-xs">No files created yet</p>
        </div>
      ) : (
        <div className="space-y-1 p-1">
          {Object.keys(props.files).map((file) => (
            <div key={file}>
              <div
                className="hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                onClick={() => {
                  setSelectedFile({ path: file, content: props.files[file] });
                  setOpen(true);
                }}
              >
                <FileText
                  size={12}
                  className="text-muted-foreground flex-shrink-0"
                />
                <span className="text-muted-foreground flex-1 text-sm leading-relaxed break-words">
                  {file}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <FileViewDialog
          file={selectedFile}
          onSaveFile={handleSaveFile}
          onClose={() => setOpen(false)}
          editDisabled={props.editDisabled}
        />
      )}
    </>
  );
}

export const TasksFilesSidebar = React.memo<TasksFilesSidebarProps>(
  ({
    todos,
    files,
    setFiles,
    activeAssistant,
    setActiveAssistant,
    setAssistantError,
    assistantError,
  }) => {
    const { isLoading, interrupt } = useChatContext();
    const [tasksOpen, setTasksOpen] = useState(false);
    const [filesOpen, setFilesOpen] = useState(false);

    const handleOptimizerToggle = useCallback((isOptimizerOpen: boolean) => {
      if (isOptimizerOpen) {
        setTasksOpen(false);
        setFilesOpen(false);
      }
    }, []);

    // Track previous counts to detect when content goes from empty to having items
    const prevTodosCount = useRef(todos.length);
    const prevFilesCount = useRef(Object.keys(files).length);

    // Auto-expand when todos go from empty to having content
    useEffect(() => {
      if (prevTodosCount.current === 0 && todos.length > 0) {
        setTasksOpen(true);
      }
      prevTodosCount.current = todos.length;
    }, [todos.length]);

    // Auto-expand when files go from empty to having content
    const filesCount = Object.keys(files).length;
    useEffect(() => {
      if (prevFilesCount.current === 0 && filesCount > 0) {
        setFilesOpen(true);
      }
      prevFilesCount.current = filesCount;
    }, [filesCount]);

    const getStatusIcon = useCallback((status: TodoItem["status"]) => {
      switch (status) {
        case "completed":
          return (
            <CheckCircle
              size={12}
              className="text-success/80"
            />
          );
        case "in_progress":
          return (
            <Clock
              size={12}
              className="text-warning/80"
            />
          );
        default:
          return (
            <Circle
              size={10}
              className="text-tertiary/70"
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

    const groupedLabels = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
    };

    return (
      <div className="min-h-0 w-full flex-1">
        <div className="font-inter flex h-full w-full flex-col p-0">
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
              <span className="text-xs font-semibold tracking-wide text-zinc-600">
                AGENT TASKS
              </span>
              <button
                onClick={() => setTasksOpen((v) => !v)}
                className={cn(
                  "hover:bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-200",
                  tasksOpen ? "rotate-180" : "rotate-0",
                )}
                aria-label="Toggle tasks panel"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            {tasksOpen && (
              <div className="bg-muted-secondary rounded-xl px-3 pb-2">
                <ScrollArea className="h-full">
                  {todos.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-4 text-center">
                      <p className="text-muted-foreground text-xs">
                        No tasks created yet
                      </p>
                    </div>
                  ) : (
                    <div className="ml-1 p-0.5">
                      {Object.entries(groupedTodos).map(([status, todos]) => (
                        <div className="mb-4">
                          <h3 className="text-tertiary mb-1 text-[10px] font-semibold tracking-wider uppercase">
                            {
                              groupedLabels[
                                status as keyof typeof groupedLabels
                              ]
                            }
                          </h3>
                          {todos.map((todo, index) => (
                            <div
                              key={`${status}_${todo.id}_${index}`}
                              className="mb-1.5 flex items-start gap-2 rounded-sm p-1 text-sm"
                            >
                              {getStatusIcon(todo.status)}
                              <span className="flex-1 leading-relaxed break-words text-inherit">
                                {todo.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
              <span className="text-xs font-semibold tracking-wide text-zinc-600">
                FILE SYSTEM
              </span>
              <button
                onClick={() => setFilesOpen((v) => !v)}
                className={cn(
                  "hover:bg-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-200",
                  filesOpen ? "rotate-180" : "rotate-0",
                )}
                aria-label="Toggle files panel"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            {filesOpen && (
              <FilesPopover
                files={files}
                setFiles={setFiles}
                editDisabled={isLoading === true || interrupt !== undefined}
              />
            )}

            <OptimizationSidebar
              activeAssistant={activeAssistant}
              setActiveAssistant={setActiveAssistant}
              setAssistantError={setAssistantError}
              assistantError={assistantError}
              onOptimizerToggle={handleOptimizerToggle}
            />
          </div>
        </div>
      </div>
    );
  },
);

TasksFilesSidebar.displayName = "TasksFilesSidebar";
