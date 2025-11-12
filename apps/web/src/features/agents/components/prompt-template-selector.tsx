/**
 * Prompt template selector component.
 *
 * Displays available agent prompt template modes for a tool and allows
 * the user to select which mode they want to use for their agent.
 * Appears below an enabled tool in the agent configuration form.
 */

"use client";

import { Tool } from "@/types/tool";
import { PromptModeCard } from "./prompt-mode-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptTemplateSelectorProps {
  /**
   * The tool for which to select a prompt mode
   */
  tool: Tool;
  /**
   * Currently selected template key (if any)
   */
  selectedMode?: string;
  /**
   * Callback when user selects a mode
   */
  onSelectMode: (templateKey: string) => void;
  /**
   * Optional className
   */
  className?: string;
}

export function PromptTemplateSelector({
  tool,
  selectedMode,
  onSelectMode,
  className,
}: PromptTemplateSelectorProps) {
  // Check if tool has agent prompts metadata
  if (!tool.metadata?.agent_prompts) {
    return null;
  }

  const { available_templates } = tool.metadata.agent_prompts;

  if (!available_templates || available_templates.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-3 space-y-3", className)}>
      <Alert variant="info">
        <Sparkles className="size-4" />
        <AlertTitle className="text-sm font-medium">
          Agent Modes Available
        </AlertTitle>
        <AlertDescription className="text-xs">
          Select a pre-configured agent mode optimized for specific use cases.
          Each mode provides a complete system prompt template with best
          practices and guidelines.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium">
          Select Agent Mode:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {available_templates.map((template) => (
            <PromptModeCard
              key={template.key}
              template={template}
              selected={selectedMode === template.key}
              onSelect={() => onSelectMode(template.key)}
              toolCategories={tool.metadata?.tool_categories}
            />
          ))}
        </div>
      </div>

      {!selectedMode && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription className="text-xs">
            Select a mode to auto-generate an optimized system prompt for this
            tool. You can preview and edit the prompt before saving.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
