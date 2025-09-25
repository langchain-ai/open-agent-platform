"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { SubagentToolsSelection } from "./subagent-tools-selection";
import type { ToolInterruptConfig } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";

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
  const [interruptConfig, setInterruptConfig] =
    React.useState<ToolInterruptConfig>({});
  const selectedTools = form.watch("tools") || [];

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

  const handleToolsChange = (tools: string[]) => {
    form.setValue("tools", tools);
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
        className="flex h-full min-h-0 flex-col sm:max-w-xl"
      >
        <SheetHeader className="px-4 pt-3 pb-2">
          <SheetTitle className="text-base">
            {editingSubAgent ? "Edit Subagent" : "Create Subagent"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground mt-1 text-xs leading-snug">
            {editingSubAgent
              ? "Edit this specialized subagent that can be called by your main agent."
              : "Create a specialized subagent that can be called by your main agent."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="scrollbar-pretty-auto min-h-0 flex-1 space-y-4 overflow-auto p-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-700">
                      Agent Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Research Assistant"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
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
                    <FormLabel className="text-xs font-semibold text-gray-700">
                      Instructions
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="You are a helpful assistant that..."
                        rows={10}
                        className="max-h-[25rem] min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Instructions that define how this subagent should behave
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Tools
                  </span>
                  <span className="text-[11px] text-gray-500">
                    ({selectedTools.length} selected)
                  </span>
                </div>
                <SubagentToolsSelection
                  selectedTools={selectedTools}
                  onToolsChange={handleToolsChange}
                  interruptConfig={interruptConfig}
                  onInterruptConfigChange={setInterruptConfig}
                />
              </div>
            </div>

            <div className="flex-shrink-0 border-t bg-white p-3">
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
