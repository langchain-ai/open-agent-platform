"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
  onDelete,
  editingSubAgent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (subAgent: SubAgent) => void;
  onDelete?: (index: number) => void;
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

  const handleDelete = () => {
    if (editingSubAgent && onDelete) {
      onDelete(editingSubAgent.index);
      onOpenChange(false);
      // reset
      form.reset({ name: "", description: "", prompt: "", tools: [] });
      setInterruptConfig({});
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex h-full min-h-0 w-[min(95vw,980px)] flex-col p-0 sm:max-w-3xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Subagent</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            {/* Header: title + description (no border) */}
            <div className="m-4 flex items-center justify-between bg-white px-4 py-3">
              <div className="min-w-0">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="m-0">
                      <FormControl>
                        <input
                          {...field}
                          required
                          placeholder="Sub-agent name..."
                          className="w-full truncate border-none bg-transparent text-[28px] leading-snug text-gray-900 outline-none focus:outline-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="m-0 mt-0.5">
                      <FormControl>
                        <input
                          {...field}
                          placeholder="Short description (optional)"
                          className="w-full truncate border-none bg-transparent text-sm text-gray-600 outline-none focus:outline-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Actions moved to bottom */}
            </div>

            {/* Body: mimic main page layout (Tools + Instructions) */}
            <div className="scrollbar-pretty-auto min-h-0 flex-1 overflow-auto px-4 pt-3 pb-0">
              {/* Tools section (compact, no background) */}
              <div className="px-1">
                <div className="mb-1 text-xs font-semibold text-gray-700">
                  Tools
                  {selectedTools.length > 0 && (
                    <span className="ml-1 text-[11px] font-normal text-gray-500">
                      ({selectedTools.length} selected)
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <SubagentToolsSelection
                    selectedTools={selectedTools}
                    onToolsChange={handleToolsChange}
                    interruptConfig={interruptConfig}
                    onInterruptConfigChange={setInterruptConfig}
                  />
                </div>
              </div>

              {/* Bottom: Instructions full-width */}
              <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                  Instructions
                </div>
                <div className="p-3">
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="You are a helpful assistant that..."
                            rows={25}
                            className="min-h-[560px] resize-y border-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex-shrink-0 border-t bg-white p-3">
              {editingSubAgent ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex-1"
                  >
                    Delete Subagent
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                  >
                    Update Subagent
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  className="w-full"
                >
                  Create Subagent
                </Button>
              )}
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
