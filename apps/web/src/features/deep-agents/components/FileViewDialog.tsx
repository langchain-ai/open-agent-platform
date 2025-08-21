"use client";

import React, { useMemo, useCallback } from "react";
import { FileText, Copy, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MarkdownContent } from "./MarkdownContent";
import type { FileItem } from "../types";

interface FileViewDialogProps {
  file: FileItem;
  onClose: () => void;
}

export const FileViewDialog = React.memo<FileViewDialogProps>(
  ({ file, onClose }) => {
    const fileExtension = useMemo(() => {
      return file.path.split(".").pop()?.toLowerCase() || "";
    }, [file.path]);

    const isMarkdown = useMemo(() => {
      return fileExtension === "md" || fileExtension === "markdown";
    }, [fileExtension]);

    const language = useMemo(() => {
      const languageMap: Record<string, string> = {
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
      return languageMap[fileExtension] || "text";
    }, [fileExtension]);

    const handleCopy = useCallback(() => {
      if (file.content) {
        navigator.clipboard.writeText(file.content);
      }
    }, [file.content]);

    const handleDownload = useCallback(() => {
      if (file.content) {
        const blob = new Blob([file.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.path;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, [file.content, file.path]);

    return (
      <Dialog
        open={true}
        onOpenChange={onClose}
      >
        <DialogContent
          className="flex max-h-[80vh] flex-col bg-[var(--color-background)]"
          style={{
            padding: "1.5rem",
            width: "60vw",
            maxWidth: "60vw",
          }}
        >
          <DialogTitle className="sr-only">{file.path}</DialogTitle>
          <div
            className="flex items-center justify-between border-b border-[var(--color-border)]"
            style={{ gap: "1rem", paddingBottom: "1rem", marginBottom: "1rem" }}
          >
            <div
              className="flex min-w-0 items-center"
              style={{ gap: "0.5rem" }}
            >
              <FileText className="h-5 w-5 shrink-0 text-[var(--color-text-secondary)]" />
              <span className="overflow-hidden text-base font-medium text-ellipsis whitespace-nowrap text-[var(--color-text-primary)]">
                {file.path}
              </span>
            </div>
            <div
              className="flex shrink-0"
              style={{ gap: "0.25rem" }}
            >
              <button
                onClick={handleCopy}
                className="flex cursor-pointer items-center"
                style={{
                  gap: "0.25rem",
                  padding: "0.25rem 0.5rem",
                  marginRight: "0.25rem",
                  backgroundColor: "transparent",
                  border: "1px solid transparent",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "var(--color-text-primary)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-border-light)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Copy size={16} />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="flex cursor-pointer items-center"
                style={{
                  gap: "0.25rem",
                  padding: "0.25rem 0.5rem",
                  marginRight: "0.25rem",
                  backgroundColor: "transparent",
                  border: "1px solid transparent",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "var(--color-text-primary)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-border-light)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          <ScrollArea
            className="max-h-[60vh] flex-1 overflow-auto rounded-md bg-[var(--color-surface)]"
            style={{ padding: "1rem" }}
          >
            {file.content ? (
              isMarkdown ? (
                <div
                  className="rounded-md bg-[var(--color-background)]"
                  style={{ padding: "1.5rem" }}
                >
                  <MarkdownContent content={file.content} />
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
                  {file.content}
                </SyntaxHighlighter>
              )
            ) : (
              <div
                className="flex items-center justify-center text-[var(--color-text-tertiary)]"
                style={{ padding: "3rem" }}
              >
                <p className="m-0 text-sm">File is empty</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  },
);

FileViewDialog.displayName = "FileViewDialog";
