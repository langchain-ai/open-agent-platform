"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HumanInterruptConfig } from "@/types/inbox";

interface InterruptConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: HumanInterruptConfig;
  onInterruptChange: (config: HumanInterruptConfig) => void;
}

export function InterruptConfigDialog({
  open,
  onOpenChange,
  config,
  onInterruptChange,
}: InterruptConfigDialogProps) {
  const handleSave = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Interrupts</DialogTitle>
          <DialogDescription>
            Configure whether or not to interrupt before calling this tool. If
            enabled, the agent will pause before calling the tool, and the user
            may take any of the allowed actions on the tool call before
            continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start gap-1">
              <Label
                htmlFor="interrupt-enabled"
                className="text-sm font-medium"
              >
                Enable Interrupts
              </Label>
              <p className="text-muted-foreground text-xs">
                Enable or disable interrupts for this tool.
              </p>
            </div>

            <Switch
              id="interrupt-enabled"
              checked={config}
              onCheckedChange={(checked) => onInterruptChange(checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
