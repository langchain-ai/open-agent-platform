"use client";

import React, { useState } from "react";
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
import { HumanInterruptConfig } from "@/components/agent-inbox/types";

interface InterruptConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InterruptConfigDialog({
  open,
  onOpenChange,
}: InterruptConfigDialogProps) {
  const [config, setConfig] = useState<HumanInterruptConfig>({
    allow_accept: false,
    allow_respond: false,
    allow_edit: false,
    allow_ignore: false,
  });

  const handleSave = () => {
    console.log("Interrupt configuration:", config);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Interrupts</DialogTitle>
          <DialogDescription>
            Configure whether or not to interrupt before calling this tool. If enabled, the agent will pause before calling the tool, and the user may take any of the allowed actions on the tool call before continuing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Action Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-accept" className="text-sm font-medium">
                Allow accept
              </Label>
              <Switch
                id="allow-accept"
                checked={config.allow_accept}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, allow_accept: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allow-respond" className="text-sm font-medium">
                Allow respond
              </Label>
              <Switch
                id="allow-respond"
                checked={config.allow_respond}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, allow_respond: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allow-edit" className="text-sm font-medium">
                Allow edit
              </Label>
              <Switch
                id="allow-edit"
                checked={config.allow_edit}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, allow_edit: checked }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
