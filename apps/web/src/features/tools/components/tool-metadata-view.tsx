/**
 * Tool Metadata View Component.
 *
 * Displays comprehensive metadata for a tool including available agent modes,
 * best practices, common pitfalls, and configuration hints. Used in the
 * Tools page detail dialog.
 */

"use client";

import { useState } from "react";
import { Tool } from "@/types/tool";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownText } from "@/components/ui/markdown-text";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchPromptTemplate } from "@/lib/prompt-api";
import { estimatePromptTokens } from "@/lib/prompt-compiler";
import { FullPromptTemplate } from "@/types/prompt";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface ToolMetadataViewProps {
  /**
   * The tool to display metadata for
   */
  tool: Tool;
}

export function ToolMetadataView({ tool }: ToolMetadataViewProps) {
  if (!tool.metadata?.agent_prompts) {
    return (
      <Alert>
        <AlertDescription>
          No agent prompt recommendations available for this tool.
        </AlertDescription>
      </Alert>
    );
  }

  const {
    available_templates,
    general_best_practices,
    common_pitfalls,
    configuration_hints,
  } = tool.metadata.agent_prompts;

  return (
    <div className="space-y-6">
      {/* Agent Modes Section */}
      {available_templates && available_templates.length > 0 && (
        <AgentModesSection
          templates={available_templates}
          mcpServer={tool.metadata!.mcp_server!}
        />
      )}

      {/* Best Practices Section */}
      {general_best_practices && general_best_practices.length > 0 && (
        <>
          <Separator />
          <CollapsibleSection
            title="Best Practices"
            icon={<Lightbulb className="size-5 text-green-600" />}
            defaultOpen
          >
            <div className="space-y-2">
              {general_best_practices.map((practice, index) => (
                <div
                  key={index}
                  className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950"
                >
                  <MarkdownText className="text-sm text-green-900 dark:text-green-100">
                    {practice}
                  </MarkdownText>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* Common Pitfalls Section */}
      {common_pitfalls && common_pitfalls.length > 0 && (
        <>
          <Separator />
          <CollapsibleSection
            title="Common Pitfalls"
            icon={<AlertTriangle className="size-5 text-yellow-600" />}
          >
            <div className="space-y-2">
              {common_pitfalls.map((pitfall, index) => (
                <div
                  key={index}
                  className="rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950"
                >
                  <MarkdownText className="text-sm text-yellow-900 dark:text-yellow-100">
                    {pitfall}
                  </MarkdownText>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* Configuration Hints Section */}
      {configuration_hints && Object.keys(configuration_hints).length > 0 && (
        <>
          <Separator />
          <CollapsibleSection
            title="Configuration Requirements"
            icon={<Settings className="size-5 text-blue-600" />}
          >
            <div className="space-y-2">
              {Object.entries(configuration_hints).map(([key, hint]) => (
                <div
                  key={key}
                  className="bg-muted rounded-md p-3"
                >
                  <p className="font-mono text-xs font-semibold">{key}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

/**
 * Agent Modes Section with progressive disclosure for long lists
 */
function AgentModesSection({
  templates,
  mcpServer,
}: {
  templates: {
    key: string;
    name: string;
    description: string;
    recommended_for?: string[];
  }[];
  mcpServer: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW = 4; // Show first 4 modes by default
  const hasMore = templates.length > INITIAL_SHOW;
  const visibleTemplates = showAll
    ? templates
    : templates.slice(0, INITIAL_SHOW);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary size-5" />
        <h3 className="text-lg font-semibold">Agent Modes</h3>
        <Badge>{templates.length} available</Badge>
      </div>
      <p className="text-muted-foreground text-sm">
        Pre-configured agent personas optimized for specific use cases. Each
        mode provides a complete system prompt with guidelines and best
        practices.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleTemplates.map((template) => (
          <TemplateModeCard
            key={template.key}
            template={template}
            mcpServer={mcpServer}
          />
        ))}
      </div>
      {hasMore && !showAll && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowAll(true)}
        >
          <ChevronDown className="mr-2 size-4" />
          Show {templates.length - INITIAL_SHOW} More Modes
        </Button>
      )}
      {hasMore && showAll && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowAll(false)}
        >
          <ChevronRight className="mr-2 size-4" />
          Show Less
        </Button>
      )}
    </div>
  );
}

/**
 * Individual template mode card with view full prompt action
 */
function TemplateModeCard({
  template,
  mcpServer,
}: {
  template: {
    key: string;
    name: string;
    description: string;
    recommended_for?: string[];
  };
  mcpServer: string;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [fullTemplate, setFullTemplate] = useState<FullPromptTemplate | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const handleViewPrompt = async () => {
    if (fullTemplate) {
      // Already loaded, just open
      setShowPrompt(true);
      return;
    }

    setLoading(true);
    try {
      const fetchedTemplate = await fetchPromptTemplate(
        mcpServer,
        template.key,
      );
      setFullTemplate(fetchedTemplate);
      setShowPrompt(true);
    } catch (err) {
      toast.error("Failed to load prompt template", {
        description:
          err instanceof Error ? err.message : "Unknown error occurred",
        richColors: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const tokenEstimate = fullTemplate
    ? estimatePromptTokens(fullTemplate.system_prompt)
    : 0;

  return (
    <>
      <Card className="hover:border-primary/50 transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <CardDescription className="text-xs">
            {template.description}
          </CardDescription>
        </CardHeader>
        {template.recommended_for && template.recommended_for.length > 0 && (
          <CardContent className="space-y-2 pt-0">
            <p className="text-muted-foreground text-xs font-medium">
              Recommended for:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {template.recommended_for.slice(0, 3).map((useCase, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs"
                >
                  {useCase}
                </Badge>
              ))}
              {template.recommended_for.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  +{template.recommended_for.length - 3}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={handleViewPrompt}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Eye className="size-4" />
                  View Full Prompt
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Full Prompt Sheet (Side Drawer) */}
      <Sheet
        open={showPrompt}
        onOpenChange={setShowPrompt}
      >
        <SheetContent
          side="right"
          className="w-full overflow-auto sm:max-w-2xl"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {fullTemplate?.name}
              {tokenEstimate > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  ~{tokenEstimate.toLocaleString()} tokens
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>{fullTemplate?.description}</SheetDescription>
          </SheetHeader>

          {/* Token size warnings */}
          {tokenEstimate > 4000 && (
            <Alert
              variant="destructive"
              className="mt-4"
            >
              <AlertTriangle className="size-4" />
              <AlertTitle>Very Large Prompt</AlertTitle>
              <AlertDescription className="text-sm">
                This prompt template is {tokenEstimate.toLocaleString()} tokens.
                Consider using a model with large context window (GPT-4, Claude)
                or selecting a simpler mode for your agent.
              </AlertDescription>
            </Alert>
          )}
          {tokenEstimate > 2000 && tokenEstimate <= 4000 && (
            <Alert className="mt-4">
              <AlertTriangle className="size-4 text-yellow-600" />
              <AlertTitle>Comprehensive Prompt</AlertTitle>
              <AlertDescription className="text-xs">
                This prompt is {tokenEstimate.toLocaleString()} tokens,
                providing detailed guidance. Ensure your model supports this
                context size.
              </AlertDescription>
            </Alert>
          )}

          {fullTemplate && (
            <Tabs
              defaultValue="prompt"
              className="mt-6"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                <TabsTrigger
                  value="guidelines"
                  disabled={
                    !fullTemplate.tool_usage_guidelines ||
                    fullTemplate.tool_usage_guidelines.length === 0
                  }
                >
                  Guidelines
                </TabsTrigger>
                <TabsTrigger
                  value="examples"
                  disabled={
                    !fullTemplate.example_queries ||
                    fullTemplate.example_queries.length === 0
                  }
                >
                  Examples
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="prompt"
                className="mt-4"
              >
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="bg-muted/30 rounded-md border p-6">
                    <MarkdownText>{fullTemplate.system_prompt}</MarkdownText>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="guidelines"
                className="mt-4"
              >
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-3">
                    {fullTemplate.tool_usage_guidelines?.map((guideline, i) => (
                      <div
                        key={i}
                        className="bg-card rounded-md border p-3"
                      >
                        <p className="text-sm">{guideline}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="examples"
                className="mt-4"
              >
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-medium">
                      Example queries that work well with this mode:
                    </p>
                    {fullTemplate.example_queries?.map((query, i) => (
                      <div
                        key={i}
                        className="border-primary/20 bg-primary/5 rounded-md border p-3"
                      >
                        <p className="font-mono text-sm">&quot;{query}&quot;</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * Collapsible section component
 */
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-80">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className="size-5" />
        ) : (
          <ChevronRight className="size-5" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}
