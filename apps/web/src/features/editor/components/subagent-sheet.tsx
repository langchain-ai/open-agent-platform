"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
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
import { CreateAgentToolsSelection } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import type { SubAgent } from "@/types/sub-agent";

type SubAgentFormValues = z.infer<typeof subAgentSchema>;

export function SubAgentSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (subAgent: SubAgent) => void;
}) {
  const form = useForm<SubAgentFormValues>({
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      tools: [],
    },
  });
  const [interruptConfig, setInterruptConfig] = React.useState<
    Record<string, boolean>
  >({});

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
        className="sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>Add Sub-agent</SheetTitle>
          <SheetDescription>
            Configure a sub-agent. It will be available to the main agent and
            can be targeted from the hierarchy.
          </SheetDescription>
        </SheetHeader>
        <div className="scrollbar-pretty-auto flex-1 overflow-auto p-4 pt-0">
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="researcher_agent"
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short name the main agent will see.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What this sub-agent is for"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="You're an expert ..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tools"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tools</FormLabel>
                    <FormControl>
                      <CreateAgentToolsSelection
                        selectedTools={field.value}
                        onToolsChange={field.onChange}
                        interruptConfig={interruptConfig}
                        onInterruptConfigChange={setInterruptConfig}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Sub-agent</Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
