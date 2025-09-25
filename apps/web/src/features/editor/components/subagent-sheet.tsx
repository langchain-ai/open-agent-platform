"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, HelpCircle } from "lucide-react";
import { Search } from "@/components/ui/tool-search";
import { Switch } from "@/components/ui/switch";
import { useMCPContext } from "@/providers/MCP";
import { useSearchTools } from "@/hooks/use-search-tools";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import _ from "lodash";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { SubAgent } from "@/types/sub-agent";

type SubAgentFormValues = {
  name: string;
  description?: string;
  prompt?: string;
  tools: string[];
};

export function SubAgentSheet({
  open,
  onOpenChange,
  onSubmit,
  editingSubAgent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (subAgent: SubAgent) => void;
  editingSubAgent?: { subAgent: SubAgent; index: number } | null;
}) {
  const form = useForm<SubAgentFormValues>({
    defaultValues: {
      name: editingSubAgent?.subAgent.name || "",
      description: editingSubAgent?.subAgent.description || "",
      prompt: editingSubAgent?.subAgent.prompt || "",
      tools: editingSubAgent?.subAgent.tools || [],
    },
  });
  const [interruptConfig, setInterruptConfig] = React.useState<
    Record<string, boolean>
  >({});
  const [openInterrupts, setOpenInterrupts] = useState<Set<string>>(new Set());
  const { tools: allTools } = useMCPContext();
  const selectedTools = form.watch("tools") || [];
  const { filteredTools, debouncedSetSearchTerm } = useSearchTools(allTools, {
    preSelectedTools: selectedTools,
  });

  // Reset form when editingSubAgent changes
  useEffect(() => {
    if (editingSubAgent) {
      form.reset({
        name: editingSubAgent.subAgent.name,
        description: editingSubAgent.subAgent.description || "",
        prompt: editingSubAgent.subAgent.prompt || "",
        tools: editingSubAgent.subAgent.tools || [],
      });
      setInterruptConfig(
        (editingSubAgent.subAgent as any).interrupt_config || {},
      );
    } else {
      form.reset({
        name: "",
        description: "",
        prompt: "",
        tools: [],
      });
      setInterruptConfig({});
    }
  }, [editingSubAgent, form]);

  const handleToolToggle = (toolName: string) => {
    const currentTools = form.getValues("tools") || [];
    if (currentTools.includes(toolName)) {
      form.setValue(
        "tools",
        currentTools.filter((t) => t !== toolName),
      );
    } else {
      form.setValue("tools", [...currentTools, toolName]);
    }
  };

  const handleSubmit = (values: SubAgentFormValues) => {
    const subAgent: SubAgent = {
      name: values.name,
      description: values.description || "",
      prompt: values.prompt || "",
      tools: values.tools || [],
      // ensure mcp_server default
      mcp_server: process.env.NEXT_PUBLIC_MCP_SERVER_URL || "",
      // pass interrupts via any-typed property for parity with existing usage
      ...(Object.keys(interruptConfig).length
        ? { interrupt_config: interruptConfig as any }
        : {}),
    } as SubAgent;
    onSubmit(subAgent);
    onOpenChange(false);
    // reset
    form.reset({ name: "", description: "", prompt: "", tools: [] });
    setInterruptConfig({});
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex flex-col sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>
            {editingSubAgent ? "Edit Subagent" : "Create Subagent"}
          </SheetTitle>
          <SheetDescription>
            {editingSubAgent
              ? "Edit this specialized subagent that can be called by your main agent."
              : "Create a specialized subagent that can be called by your main agent."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="flex flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="scrollbar-pretty-auto flex-1 space-y-6 overflow-auto p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Agent Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Research Assistant"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this subagent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Instructions
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="You are a helpful assistant that..."
                        rows={25}
                        className="min-h-[400px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Instructions that define how this subagent should behave
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Tools
                  </span>
                  <span className="text-xs text-gray-500">
                    ({form.watch("tools")?.length || 0} selected)
                  </span>
                </div>
                <Search
                  onSearchChange={(term) => debouncedSetSearchTerm(term)}
                  placeholder="Search tools..."
                />
                <div className="max-h-75 overflow-y-auto rounded-md border">
                  {filteredTools.length > 0 ? (
                    filteredTools.map((tool) => (
                      <div key={tool.name}>
                        <div className="flex items-stretch">
                          <button
                            className="flex-1 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => handleToolToggle(tool.name)}
                          >
                            <div className="flex items-center gap-2 font-medium">
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5",
                                  selectedTools.includes(tool.name)
                                    ? "text-[#2F6868]"
                                    : "text-transparent",
                                )}
                              />
                              <span className="truncate">
                                {_.startCase(tool.name)}
                              </span>
                              {interruptConfig[tool.name] === true && (
                                <span
                                  title="Interrupts enabled"
                                  className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#2F6868]"
                                />
                              )}
                            </div>
                            {tool.description && (
                              <div className="mt-1 line-clamp-2 pl-6 text-xs text-gray-500">
                                {tool.description}
                              </div>
                            )}
                          </button>
                          <button
                            type="button"
                            className="ml-auto px-2 text-gray-400 transition-colors hover:text-gray-600"
                            title="Configure interrupt"
                            onClick={() => {
                              setOpenInterrupts((prev) => {
                                const next = new Set(prev);
                                if (next.has(tool.name)) next.delete(tool.name);
                                else next.add(tool.name);
                                return next;
                              });
                            }}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                openInterrupts.has(tool.name)
                                  ? "rotate-180"
                                  : "",
                              )}
                            />
                          </button>
                        </div>
                        {openInterrupts.has(tool.name) && (
                          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase">
                                <span>Interrupt</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3 w-3 cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Enabling interrupts will pause the agent
                                        before this tool's action is executed,
                                        allowing you to approve, reject, edit,
                                        or send feedback on the proposed action.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <Switch
                                checked={interruptConfig[tool.name] === true}
                                onCheckedChange={(checked) => {
                                  setInterruptConfig((prev) => ({
                                    ...prev,
                                    [tool.name]: checked,
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500">
                      No tools found
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 p-4">
              <Button
                type="submit"
                className="w-full"
              >
                {editingSubAgent ? "Update Subagent" : "Create Subagent"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
