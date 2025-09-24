"use client";

import { CreateAgentToolsSelection } from "@/components/agent-creator-sheet/components/create-agent-tools-selection";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import type { ToolInterruptConfig } from "./create-agent-tools-selection";

const humanInterruptConfigSchema = z.object({
  allow_accept: z.boolean(),
  allow_respond: z.boolean(),
  allow_edit: z.boolean(),
  allow_ignore: z.boolean(),
});

export const agentToolsFormSchema = z.object({
  tools: z.array(z.string()),
  interruptConfig: z
    .record(z.string(), humanInterruptConfigSchema)
    .default({})
    .optional(),
});

export type AgentToolsFormValues = z.infer<typeof agentToolsFormSchema>;

export function useAgentToolsForm(
  defaultValues: Partial<AgentToolsFormValues> = {},
) {
  return useForm<AgentToolsFormValues>({
    defaultValues: {
      tools: [],
      interruptConfig: {},
      ...defaultValues,
    },
  });
}

interface AgentToolsFormProps {
  form: UseFormReturn<AgentToolsFormValues>;
  className?: string;
  onSubmit?: (values: AgentToolsFormValues) => void;
}

export function AgentToolsForm({
  form,
  className,
  onSubmit,
}: AgentToolsFormProps) {
  const interruptConfig =
    form.watch("interruptConfig") ?? ({} as ToolInterruptConfig);

  return (
    <Form {...form}>
      <form
        className={cn("space-y-4", className)}
        onSubmit={
          onSubmit
            ? form.handleSubmit(onSubmit)
            : (event) => event.preventDefault()
        }
      >
        <div className="mb-6">
          <h2 className="text-md font- mb-2">Tools</h2>
          <p className="text-muted-foreground">Set up tools for your agent</p>
        </div>
        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem className="scrollbar-pretty-auto max-h-[60vh] pr-2">
              <FormLabel>Tools</FormLabel>
              <FormControl>
                <CreateAgentToolsSelection
                  selectedTools={field.value ?? []}
                  onToolsChange={(value) => field.onChange(value)}
                  interruptConfig={interruptConfig}
                  onInterruptConfigChange={(value) =>
                    form.setValue("interruptConfig", value, {
                      shouldDirty: true,
                    })
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
