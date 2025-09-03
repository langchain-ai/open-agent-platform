"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { FileText, Copy, Download, Edit, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MarkdownContent } from "./MarkdownContent";
import type { FileItem } from "../types";

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  cpp: "cpp",
  c: "c",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  scala: "scala",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  json: "json",
  xml: "xml",
  html: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  sql: "sql",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  ini: "ini",
  dockerfile: "dockerfile",
  makefile: "makefile",
};

interface FileViewDialogProps {
  file: FileItem | null;
  onSaveFile: (fileName: string, content: string) => void;
  onClose: () => void;
  editDisabled: boolean;
}

export const FileViewDialog = React.memo<FileViewDialogProps>(
  ({ file, onSaveFile, onClose, editDisabled }) => {
    const [isEditingMode, setIsEditingMode] = useState(file === null);
    const [fileName, setFileName] = useState(file?.path || "");
    const [fileContent, setFileContent] = useState(file?.content || "");

    useEffect(() => {
      setFileName(file?.path || "");
      setFileContent(file?.content || "");
      setIsEditingMode(file === null);
    }, [file]);

    const fileExtension = useMemo(() => {
      return fileName.split(".").pop()?.toLowerCase() || "";
    }, [fileName]);

    const isMarkdown = useMemo(() => {
      return fileExtension === "md" || fileExtension === "markdown";
    }, [fileExtension]);

    const language = useMemo(() => {
      return LANGUAGE_MAP[fileExtension] || "text";
    }, [fileExtension]);

    const handleCopy = useCallback(() => {
      if (fileContent) {
        navigator.clipboard.writeText(fileContent);
      }
    }, [fileContent]);

    const handleDownload = useCallback(() => {
      if (fileContent && fileName) {
        const blob = new Blob([fileContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, [fileContent, fileName]);

    const handleEdit = useCallback(() => {
      setIsEditingMode(true);
    }, []);

    const handleSave = useCallback(() => {
      if (!fileName || !fileContent) {
        return;
      }
      onSaveFile(fileName, fileContent);
      setIsEditingMode(false);
    }, [fileName, fileContent, onSaveFile]);

    const handleCancel = useCallback(() => {
      if (file === null) {
        onClose();
      } else {
        setFileName(file.path);
        setFileContent(file.content);
        setIsEditingMode(false);
      }
    }, [file, onClose]);

    const fileNameIsValid = useMemo(() => {
      return (
        fileName.trim() !== "" &&
        !fileName.includes("/") &&
        !fileName.includes(" ")
      );
    }, [fileName]);

    return (
      <Dialog
        open={true}
        onOpenChange={onClose}
      >
        <DialogContent className="flex max-h-[80vh] min-w-[60vw] flex-col p-6">
          <DialogTitle className="sr-only">
            {file?.path || "New File"}
          </DialogTitle>
          <div className="border-border mb-4 flex items-center justify-between border-b pb-4">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="text-primary/50 h-5 w-5 shrink-0" />
              {isEditingMode && file === null ? (
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter filename..."
                  className="text-base font-medium"
                  aria-invalid={!fileNameIsValid}
                />
              ) : (
                <span className="text-primary overflow-hidden text-base font-medium text-ellipsis whitespace-nowrap">
                  {file?.path}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!isEditingMode && (
                <>
                  <Button
                    onClick={handleEdit}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    disabled={editDisabled}
                  >
                    <Edit
                      size={16}
                      className="mr-1"
                    />
                    Edit
                  </Button>
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                  >
                    <Copy
                      size={16}
                      className="mr-1"
                    />
                    Copy
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                  >
                    <Download
                      size={16}
                      className="mr-1"
                    />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            {isEditingMode ? (
              <Textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="Enter file content..."
                className="h-full min-h-[400px] resize-none font-mono text-sm"
              />
            ) : (
              <ScrollArea className="bg-surface h-full max-h-[60vh] rounded-md p-4">
                {fileContent ? (
                  isMarkdown ? (
                    <div className="rounded-md p-6">
                      <MarkdownContent content={fileContent} />
                    </div>
                  ) : (
                    <SyntaxHighlighter
                      language={language}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                      showLineNumbers
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  )
                ) : (
                  <div className="flex items-center justify-center p-12">
                    <p className="text-muted-foreground text-sm">
                      File is empty
                    </p>
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
          {isEditingMode && (
            <div className="border-border mt-4 flex justify-end gap-2 border-t pt-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
              >
                <X
                  size={16}
                  className="mr-1"
                />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={
                  !fileName.trim() || !fileContent.trim() || !fileNameIsValid
                }
              >
                <Save
                  size={16}
                  className="mr-1"
                />
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

FileViewDialog.displayName = "FileViewDialog";
