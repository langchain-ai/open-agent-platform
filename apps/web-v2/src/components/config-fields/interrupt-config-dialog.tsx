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
  config: HumanInterruptConfig | boolean;
  onInterruptChange: (config: HumanInterruptConfig | boolean) => void;
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
          {/* Action Switches */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col items-start gap-1">
                <Label
                  htmlFor="allow-accept"
                  className="text-sm font-medium"
                >
                  Allow accept
                </Label>
                <p className="text-muted-foreground text-xs">
                  The user must accept the tool call before it is executed.
                </p>
              </div>

              <Switch
                id="allow-accept"
                checked={
                  typeof config === "boolean" ? config : config.allow_accept
                }
                onCheckedChange={(checked) =>
                  onInterruptChange({
                    ...(typeof config === "boolean"
                      ? {
                          allow_edit: config,
                          allow_ignore: config,
                          allow_respond: config,
                          allow_accept: config,
                        }
                      : config),
                    allow_accept: checked,
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col items-start gap-1">
                <Label
                  htmlFor="allow-respond"
                  className="text-sm font-medium"
                >
                  Allow respond
                </Label>
                <p className="text-muted-foreground text-xs">
                  The user may submit a response to the LLM before it is
                  executed.
                </p>
              </div>

              <Switch
                id="allow-respond"
                checked={
                  typeof config === "boolean" ? config : config.allow_respond
                }
                onCheckedChange={(checked) =>
                  onInterruptChange({
                    ...(typeof config === "boolean"
                      ? {
                          allow_edit: config,
                          allow_ignore: config,
                          allow_respond: config,
                          allow_accept: config,
                        }
                      : config),
                    allow_respond: checked,
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col items-start gap-1">
                <Label
                  htmlFor="allow-edit"
                  className="text-sm font-medium"
                >
                  Allow edit
                </Label>
                <p className="text-muted-foreground text-xs">
                  Allow the user to edit the arguments of the tool call before
                  executing it.
                </p>
              </div>

              <Switch
                id="allow-edit"
                checked={
                  typeof config === "boolean" ? config : config.allow_edit
                }
                onCheckedChange={(checked) =>
                  onInterruptChange({
                    ...(typeof config === "boolean"
                      ? {
                          allow_edit: config,
                          allow_ignore: config,
                          allow_respond: config,
                          allow_accept: config,
                        }
                      : config),
                    allow_edit: checked,
                  })
                }
              />
            </div>
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
