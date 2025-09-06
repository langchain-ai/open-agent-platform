"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Agent } from "@/types/agent";
import { useCrons } from "@/hooks/use-crons";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Cron } from "@/types/cron";
import { CronForm } from "./cron-form";

interface CronDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CronDialog({ agent, open, onOpenChange }: CronDialogProps) {
  const { crons, loading, listCrons, deleteCron } = useCrons();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCron, setEditingCron] = useState<Cron | null>(null);
  const [deletingCron, setDeletingCron] = useState<Cron | null>(null);

  // Fetch crons when dialog opens
  useEffect(() => {
    if (open && agent.assistant_id && agent.deploymentId) {
      listCrons(agent.assistant_id, agent.deploymentId);
    }
  }, [open, agent.assistant_id, agent.deploymentId, listCrons]);

  // Helper function to format the input message
  const getInputMessage = (cron: Cron) => {
    const messages = cron.input?.messages || [];
    const firstMessage = messages.find((msg) => msg.role === "user");
    return firstMessage?.content || "No message";
  };

  // Helper function to format the cron schedule in a readable way
  const formatSchedule = (schedule: string) => {
    // Basic cron schedule descriptions
    const commonPatterns: Record<string, string> = {
      "0 * * * *": "Every hour",
      "0 0 * * *": "Daily at midnight",
      "0 9 * * *": "Daily at 9 AM",
      "0 0 * * 0": "Weekly on Sunday",
      "0 0 1 * *": "Monthly on the 1st",
      "*/5 * * * *": "Every 5 minutes",
      "*/15 * * * *": "Every 15 minutes",
      "*/30 * * * *": "Every 30 minutes",
    };

    return commonPatterns[schedule] || schedule;
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle>Cron Jobs for {agent.name}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            {/* Create button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowCreateForm(true)}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Cron Job
              </Button>
            </div>

            {/* Crons table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : crons.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No cron jobs found. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Input Message</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crons.map((cron) => (
                    <TableRow key={cron.cron_id}>
                      <TableCell className="font-medium">
                        {cron.metadata?.name || "Unnamed"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">
                            {cron.schedule}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {formatSchedule(cron.schedule)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {getInputMessage(cron)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCron(cron)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingCron(cron)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Cron form for create/edit */}
        {(showCreateForm || editingCron) && (
          <div className="mt-4 rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">
              {editingCron ? "Edit Cron Job" : "Create New Cron Job"}
            </h3>
            <CronForm
              agent={agent}
              cron={editingCron}
              onSuccess={() => {
                setShowCreateForm(false);
                setEditingCron(null);
              }}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingCron(null);
              }}
            />
          </div>
        )}
      </AlertDialogContent>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingCron}
        onOpenChange={(open) => !open && setDeletingCron(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              cron job
              <span className="font-semibold">
                {" "}
                "{deletingCron?.metadata?.name || "Unnamed"}"
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCron(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingCron) {
                  await deleteCron(
                    deletingCron.cron_id,
                    agent.deploymentId,
                    agent.assistant_id,
                  );
                  setDeletingCron(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialog>
  );
}
