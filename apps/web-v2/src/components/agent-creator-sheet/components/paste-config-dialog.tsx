"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function PasteConfigDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => void;
}) {
  const { open, onOpenChange, onSubmit } = props;
  const [text, setText] = useState("");

  const EXAMPLE_CONFIG_PLACEHOLDER = JSON.stringify(
    {
      name: "...",
      metadata: { description: "..." },
      config: { configurable: {} },
    },
    null,
    2,
  );

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setText("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paste Agent Configuration</DialogTitle>
          <DialogDescription>
            Paste the JSON configuration to import. It should include metadata
            and a config.configurable object.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE_CONFIG_PLACEHOLDER}
          className="min-h-64 font-mono"
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button onClick={() => onSubmit(text)}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
