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
import { useChatContext } from "../providers/ChatContext";
import { cn } from "../lib/utils";
import { FileViewDialog } from "./FileViewDialog";

interface TasksFilesSidebarProps {
  todos: TodoItem[];
  files: Record<string, string>;
  setFiles: (files: Record<string, string>) => void;
}

export const TasksFilesSidebar = React.memo<TasksFilesSidebarProps>(
  ({ todos, files, setFiles }) => {
    const { isLoading, interrupt } = useChatContext();
    const [isFileCreationDialogOpen, setIsFileCreationDialogOpen] =
      useState(false);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [tasksOpen, setTasksOpen] = useState(false);
    const [filesOpen, setFilesOpen] = useState(false);

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
    useEffect(() => {
      const filesCount = Object.keys(files).length;
      if (prevFilesCount.current === 0 && filesCount > 0) {
        setFilesOpen(true);
      }
      prevFilesCount.current = filesCount;
    }, [Object.keys(files).length]);

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

    return (
      <div className="min-h-0 w-[252px] flex-shrink-0">
        <div
          className="bg-background flex h-full w-full flex-col p-0"
          style={{
            fontFamily:
              "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Noto Sans', sans-serif",
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            <div className="bg-muted/30 rounded-xl">
              <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide">
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
                <div className="px-3 pb-2">
                  <ScrollArea className="h-full">
                    {todos.length === 0 ? (
                      <div className="flex h-full items-center justify-center p-4 text-center">
                        <p className="text-muted-foreground text-xs">
                          No tasks created yet
                        </p>
                      </div>
                    ) : (
                      <div className="ml-1 p-0.5">
                        {groupedTodos.in_progress.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-tertiary mb-1 text-[10px] font-semibold tracking-wider uppercase">
                              In Progress
                            </h3>
                            {groupedTodos.in_progress.map((todo, index) => (
                              <div
                                key={`in_progress_${todo.id}_${index}`}
                                className="mb-1.5 flex items-start gap-2 rounded-sm p-1 text-sm"
                              >
                                {getStatusIcon(todo.status)}
                                <span className="flex-1 leading-relaxed break-words text-inherit">
                                  {todo.content}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {groupedTodos.pending.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-tertiary mb-1 text-[10px] font-semibold tracking-wider uppercase">
                              Pending
                            </h3>
                            {groupedTodos.pending.map((todo, index) => (
                              <div
                                key={`pending_${todo.id}_${index}`}
                                className="mb-1.5 flex items-start gap-2 rounded-sm p-1 text-sm"
                              >
                                {getStatusIcon(todo.status)}
                                <span className="flex-1 leading-relaxed break-words text-inherit">
                                  {todo.content}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {groupedTodos.completed.length > 0 && (
                          <div className="mb-0">
                            <h3 className="text-tertiary mb-1 text-[10px] font-semibold tracking-wider uppercase">
                              Completed
                            </h3>
                            {groupedTodos.completed.map((todo, index) => (
                              <div
                                key={`completed_${todo.id}_${index}`}
                                className="mb-1.5 flex items-start gap-2 rounded-sm p-1 text-sm"
                              >
                                {getStatusIcon(todo.status)}
                                <span className="flex-1 leading-relaxed break-words text-inherit">
                                  {todo.content}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="bg-muted/30 rounded-xl">
              <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide">
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
                <div className="px-3 pb-2">
                  <div className="hidden justify-end pb-2">
                    {/* <Button
                      onClick={handleClickCreateButton}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3"
                      disabled={isLoading === true || interrupt !== undefined}
                    >
                      <Plus size={16} className="mr-1" />
                      Create New File
                    </Button> */}
                  </div>
                  <ScrollArea className="h-full">
                    {Object.keys(files).length === 0 ? (
                      <div className="flex h-full items-center justify-center p-4 text-center">
                        <p className="text-muted-foreground text-xs">
                          No files created yet
                        </p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {Object.keys(files).map((file) => (
                          <div
                            key={file}
                            className="mb-1"
                          >
                            <div
                              className="hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5"
                              onClick={() => {
                                setSelectedFile({
                                  path: file,
                                  content: files[file],
                                });
                                setIsFileCreationDialogOpen(true);
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
                  </ScrollArea>
                  {isFileCreationDialogOpen && (
                    <FileViewDialog
                      file={selectedFile}
                      onSaveFile={handleSaveFile}
                      onClose={handleCloseFileDialog}
                      editDisabled={
                        isLoading === true || interrupt !== undefined
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

TasksFilesSidebar.displayName = "TasksFilesSidebar";
