/**
 * System Prompt Editor Dialog.
 *
 * Allows users to edit the compiled system prompt, switching from
 * using the template to a custom version. Provides save and reset
 * functionality.
 */

"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { estimatePromptTokens } from "@/lib/prompt-compiler";
import { RotateCcw, Save, Eye, Code } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownText } from "@/components/ui/markdown-text";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SystemPromptEditorDialogProps {
  /**
   * Whether dialog is open
   */
  open: boolean;
  /**
   * Callback to close dialog
   */
  onClose: () => void;
  /**
   * Initial prompt to edit (usually the compiled template)
   */
  initialPrompt: string;
  /**
   * Callback when user saves their edited prompt
   */
  onSave: (editedPrompt: string) => void;
  /**
   * Optional callback to reset to compiled template
   */
  onReset?: () => void;
}

export function SystemPromptEditorDialog({
  open,
  onClose,
  initialPrompt,
  onSave,
  onReset,
}: SystemPromptEditorDialogProps) {
  const [editedPrompt, setEditedPrompt] = useState(initialPrompt);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset edited prompt when initial changes or dialog opens
  useState(() => {
    if (open) {
      setEditedPrompt(initialPrompt);
      setHasChanges(false);
    }
  });

  const tokenEstimate = estimatePromptTokens(editedPrompt);

  const handleSave = () => {
    if (!editedPrompt.trim()) {
      toast.error("System prompt cannot be empty", {
        richColors: true,
      });
      return;
    }

    onSave(editedPrompt);
    toast.success("Custom system prompt saved", {
      description: "This agent will use your edited prompt.",
      richColors: true,
    });
    onClose();
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setEditedPrompt(initialPrompt);
    setHasChanges(false);
    toast.success("Reset to compiled template", {
      richColors: true,
    });
  };

  const handleChange = (value: string) => {
    setEditedPrompt(value);
    setHasChanges(value !== initialPrompt);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit System Prompt</DialogTitle>
          <DialogDescription>
            Customize the compiled system prompt. Your changes will override the
            template and be saved with the agent configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {tokenEstimate.toLocaleString()} tokens (estimated)
            </Badge>
            {hasChanges && <Badge variant="info">Unsaved changes</Badge>}
          </div>

          {tokenEstimate > 4000 && (
            <Alert>
              <AlertDescription className="text-xs">
                This is a very large prompt ({tokenEstimate} tokens). Most
                models work best with prompts under 2000-3000 tokens. Consider
                removing sections you don't need.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">System Prompt:</p>
            <Tabs
              defaultValue="edit"
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">
                  <Code className="mr-2 size-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-2 size-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="edit"
                className="mt-4"
              >
                <Textarea
                  className="min-h-[400px] font-mono text-xs"
                  value={editedPrompt}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Enter your custom system prompt..."
                />
              </TabsContent>

              <TabsContent
                value="preview"
                className="mt-4"
              >
                <ScrollArea className="h-[400px]">
                  <div className="bg-muted/30 rounded-md border p-6">
                    {editedPrompt ? (
                      <MarkdownText>{editedPrompt}</MarkdownText>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No prompt entered yet. Switch to Edit tab to write your
                        prompt.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              Editing the prompt switches this agent to use a custom prompt
              instead of the compiled template. You can reset to the template at
              any time.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 justify-start">
            {onReset && hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="size-4" />
                Reset to Template
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!editedPrompt.trim()}
          >
            <Save className="size-4" />
            Save Custom Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
