import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { CreateAgentToolsSelection } from "../create-agent-tools-selection";

export const subAgentFormSchema = z.object({
  name: z.string(),
  description: z.string(),
  prompt: z.string(),
  tools: z.array(z.string()),
});

export function SubAgentForm(props: {
  form: UseFormReturn<z.infer<typeof subAgentFormSchema>>;
  onSubmit: (values: z.infer<typeof subAgentFormSchema>) => void;
  interruptConfig: {
    [toolName: string]: {
      allow_accept: boolean;
      allow_respond: boolean;
      allow_edit: boolean;
      allow_ignore: boolean;
    };
  };
  setInterruptConfig: (interruptConfig: {
    [toolName: string]: {
      allow_accept: boolean;
      allow_respond: boolean;
      allow_edit: boolean;
      allow_ignore: boolean;
    };
  }) => void;
  isEditing?: boolean;
}) {
  const { form, onSubmit, interruptConfig, setInterruptConfig, isEditing } =
    props;
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="linkedin_recruiter"
                  required
                  id="sub-agent-name"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The name the main agent will see when it calls the sub-agent
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
                  placeholder="Call this agent to preform research on LinkedIn to..."
                  required
                  id="sub-agent-description"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The description the main agent will see when it calls the
                sub-agent
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
              <FormLabel>Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="You're an expert AI LinkedIn recruiter. Your task is to..."
                  required
                  id="sub-agent-prompt"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The prompt the sub-agent will use when called. Should describe
                the task the sub-agent should perform in detail.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem className="scrollbar-pretty-auto max-h-[400px] pr-2">
              <FormLabel>Tools</FormLabel>
              <FormControl>
                <CreateAgentToolsSelection
                  selectedTools={field.value}
                  onToolsChange={field.onChange}
                  interruptConfig={interruptConfig}
                  onInterruptConfigChange={setInterruptConfig}
                />
              </FormControl>
              <FormDescription>
                The prompt the sub-agent will use when called. Should describe
                the task the sub-agent should perform in detail.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">
            {isEditing ? "Update Sub-agent" : "Create Sub-agent"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
