"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";

export const agentSystemPromptFormSchema = z.object({
  systemPrompt: z.string().min(1, "System prompt is required"),
});

export type AgentSystemPromptFormValues = z.infer<
  typeof agentSystemPromptFormSchema
>;

export function useAgentSystemPromptForm(
  defaultValues: Partial<AgentSystemPromptFormValues> = {},
) {
  return useForm<AgentSystemPromptFormValues>({
    defaultValues: {
      systemPrompt: "",
      ...defaultValues,
    },
  });
}

interface AgentSystemPromptFormProps {
  form: UseFormReturn<AgentSystemPromptFormValues>;
  className?: string;
  onSubmit?: (values: AgentSystemPromptFormValues) => void;
}

export function AgentSystemPromptForm({
  form,
  className,
  onSubmit,
}: AgentSystemPromptFormProps) {
  return (
    <Form {...form}>
      <form
        className={cn("space-y-6", className)}
        onSubmit={
          onSubmit
            ? form.handleSubmit(onSubmit)
            : (event) => event.preventDefault()
        }
      >
        <div className="mb-6">
          <h2 className="text-md font- mb-2">System Prompt</h2>
          <p className="text-muted-foreground">Define the system prompt</p>
        </div>
        <FormField
          control={form.control}
          name="systemPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <Textarea
                  id="system-prompt"
                  className="mt-1 min-h-[400px]"
                  placeholder="Enter the system prompt for your agent..."
                  {...field}
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
