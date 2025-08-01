"use client";

import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateCronFormData, Cron } from "@/types/cron";
import { Agent } from "@/types/agent";
import { useCrons } from "@/hooks/use-crons";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CronFormProps {
  agent: Agent;
  cron?: Cron | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CronForm({ agent, cron, onSuccess, onCancel }: CronFormProps) {
  const { createCron, updateCron, loading } = useCrons();
  
  const form = useForm<CreateCronFormData>({
    defaultValues: {
      name: "",
      schedule: "",
      inputMessage: "",
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (cron) {
      form.reset({
        name: cron.metadata?.name || "",
        schedule: cron.schedule || "",
        inputMessage: cron.input?.messages?.[0]?.content || "",
      });
    }
  }, [cron, form]);

  const onSubmit = async (data: CreateCronFormData) => {
    // Validate required fields
    if (!data.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!data.schedule.trim()) {
      toast.error("Schedule is required");
      return;
    }
    if (!data.inputMessage.trim()) {
      toast.error("Input message is required");
      return;
    }

    // Validate cron expression format (basic validation)
    const cronParts = data.schedule.trim().split(" ");
    if (cronParts.length !== 5) {
      toast.error("Invalid cron expression. Must have 5 parts (minute hour day month weekday)");
      return;
    }

    try {
      if (cron) {
        // Update existing cron
        const result = await updateCron(
          cron.cron_id,
          agent.deploymentId,
          agent.assistant_id,
          data
        );
        if (result) {
          onSuccess?.();
        }
      } else {
        // Create new cron
        const result = await createCron(
          agent.assistant_id,
          agent.deploymentId,
          data
        );
        if (result) {
          form.reset();
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Failed to save cron:", error);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Daily Report Generator"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule">
            Schedule <span className="text-red-500">*</span>
          </Label>
          <Input
            id="schedule"
            {...form.register("schedule")}
            placeholder="0 9 * * *"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Use cron expression format: minute hour day month weekday.
            Examples:
          </p>
          <ul className="text-xs text-muted-foreground ml-4 list-disc">
            <li>"0 9 * * *" - Daily at 9 AM</li>
            <li>"0 * * * *" - Every hour</li>
            <li>"*/15 * * * *" - Every 15 minutes</li>
            <li>"0 0 * * 0" - Weekly on Sunday at midnight</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            <a
              href="https://crontab.cronhub.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Use cron expression builder →
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inputMessage">
            Input Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="inputMessage"
            {...form.register("inputMessage")}
            placeholder="Generate a daily report of all activities"
            rows={4}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            This message will be sent to the agent when the cron job runs
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {cron ? "Update" : "Create"} Cron Job
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
