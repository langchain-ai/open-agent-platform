/**
 * System Prompt Preview Dialog.
 *
 * Fetches full prompt templates for selected tool modes, compiles them into
 * a single system prompt, and displays for preview. User can copy, use as-is,
 * or switch to editor mode for customization.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tool } from "@/types/tool";
import {
  compileSystemPrompt,
  buildToolModeSelections,
  estimatePromptTokens,
} from "@/lib/prompt-compiler";
import { Copy, Edit, Info, AlertTriangle } from "lucide-react";
import { AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MarkdownText } from "@/components/ui/markdown-text";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface SystemPromptPreviewDialogProps {
  /**
   * Whether dialog is open
   */
  open: boolean;
  /**
   * Callback to close dialog
   */
  onClose: () => void;
  /**
   * All available tools
   */
  tools: Tool[];
  /**
   * Names of tools enabled for this agent
   */
  selectedToolNames: string[];
  /**
   * Map of tool name to selected template key
   */
  toolPromptModes: Record<string, string>;
  /**
   * Callback when user wants to edit the prompt
   */
  onEditPrompt?: (compiledPrompt: string) => void;
  /**
   * Callback when user accepts the compiled prompt
   */
  onAcceptPrompt?: (compiledPrompt: string) => void;
}

export function SystemPromptPreviewDialog({
  open,
  onClose,
  tools,
  selectedToolNames,
  toolPromptModes,
  onEditPrompt,
  onAcceptPrompt,
}: SystemPromptPreviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compiledPrompt, setCompiledPrompt] = useState("");

  // Compile prompt when dialog opens or selections change
  useEffect(() => {
    if (!open) return;

    async function compilePrompt() {
      setLoading(true);
      setError(null);

      try {
        // Build selections from current configuration
        const selections = buildToolModeSelections(
          tools,
          selectedToolNames,
          toolPromptModes,
        );

        if (selections.length === 0) {
          setCompiledPrompt(
            "No prompt templates selected. Enable tools and select " +
              "agent modes to generate a system prompt.",
          );
          setLoading(false);
          return;
        }

        // Compile the prompt (fetches templates on demand)
        const prompt = await compileSystemPrompt(selections, {
          includeGuidelines: true,
          includeBestPractices: true,
          includePitfalls: true,
          includeExamples: false, // Keep it concise by default
        });

        setCompiledPrompt(prompt);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(
          `Failed to compile system prompt: ${errorMessage}. ` +
            `Check that the aggregator server is running and ` +
            `prompt templates are available.`,
        );
      } finally {
        setLoading(false);
      }
    }

    compilePrompt();
  }, [open, tools, selectedToolNames, toolPromptModes]);

  const tokenEstimate = compiledPrompt
    ? estimatePromptTokens(compiledPrompt)
    : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledPrompt);
    toast.success("System prompt copied to clipboard", {
      richColors: true,
    });
  };

  const handleEdit = () => {
    if (onEditPrompt) {
      onEditPrompt(compiledPrompt);
    }
    onClose();
  };

  const handleAccept = () => {
    if (onAcceptPrompt) {
      onAcceptPrompt(compiledPrompt);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Compiled System Prompt Preview</DialogTitle>
          <DialogDescription>
            Generated from selected agent modes. You can copy this prompt, use
            it as-is, or edit it to customize.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && compiledPrompt && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {tokenEstimate.toLocaleString()} tokens (estimated)
                  </Badge>
                  {tokenEstimate > 2000 && (
                    <Info className="size-4 text-yellow-600" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="size-4" />
                  Copy
                </Button>
              </div>

              {tokenEstimate > 4000 && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Very Large Prompt</AlertTitle>
                  <AlertDescription className="text-sm">
                    <p className="mb-2">
                      This prompt is {tokenEstimate.toLocaleString()} tokens,
                      which is quite large.
                    </p>
                    <p className="text-xs">
                      <strong>Recommendations:</strong>
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs">
                      <li>Edit the prompt to remove unused sections</li>
                      <li>Select fewer tools or simpler modes</li>
                      <li>Use a model with large context (GPT-4, Claude)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {tokenEstimate > 2000 && tokenEstimate <= 4000 && (
                <Alert>
                  <Info className="size-4" />
                  <AlertTitle>Comprehensive Prompt</AlertTitle>
                  <AlertDescription className="text-xs">
                    This prompt is {tokenEstimate.toLocaleString()} tokens. This
                    is comprehensive and provides detailed guidance. You can use
                    as-is for maximum capability, or edit to streamline.
                  </AlertDescription>
                </Alert>
              )}

              <ResizablePanelGroup
                direction="horizontal"
                className="mt-4 h-[500px]"
              >
                <ResizablePanel
                  defaultSize={60}
                  minSize={30}
                >
                  <div className="bg-muted/30 h-full rounded-md border p-4">
                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                      Rendered
                    </div>
                    <ScrollArea className="h-[calc(100%-1.5rem)]">
                      <div className="pr-2">
                        <MarkdownText>{compiledPrompt}</MarkdownText>
                      </div>
                    </ScrollArea>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                  defaultSize={40}
                  minSize={20}
                >
                  <div className="bg-background h-full rounded-md border p-4">
                    <div className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                      Raw
                    </div>
                    <Textarea
                      className="h-[calc(100%-1.5rem)] min-h-0 font-mono text-xs"
                      value={compiledPrompt}
                      readOnly
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogClose>
          {onEditPrompt && (
            <Button
              variant="outline"
              onClick={handleEdit}
              disabled={loading || !compiledPrompt || !!error}
            >
              <Edit className="size-4" />
              Edit Prompt
            </Button>
          )}
          {onAcceptPrompt && (
            <Button
              onClick={handleAccept}
              disabled={loading || !compiledPrompt || !!error}
            >
              Use This Prompt
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
