"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { UseFormReturn, useForm } from "react-hook-form";

export const agentConfigurationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type AgentConfigurationFormValues = z.infer<
  typeof agentConfigurationFormSchema
>;

export function useAgentConfigurationForm(
  defaultValues: Partial<AgentConfigurationFormValues> = {},
) {
  return useForm<AgentConfigurationFormValues>({
    defaultValues: {
      name: "",
      description: "",
      ...defaultValues,
    },
  });
}

interface AgentConfigurationFormProps {
  form: UseFormReturn<AgentConfigurationFormValues>;
  className?: string;
  onSubmit?: (values: AgentConfigurationFormValues) => void;
}

export function AgentConfigurationForm({
  form,
  className,
  onSubmit,
}: AgentConfigurationFormProps) {
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
          <h2 className="text-md font- mb-2">Configure your agent</h2>
          <p className="text-muted-foreground">
            Basic agent settings and configuration
          </p>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name
                <span className="-ml-1 text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  id="agent-name"
                  className="mt-1 h-10"
                  placeholder="Enter agent name"
                  {...field}
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
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  id="agent-description"
                  className="mt-1 min-h-[197px]"
                  placeholder="e.g. Handles common customer questions, provides troubleshooting steps, and escalates complex issues to a human."
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
