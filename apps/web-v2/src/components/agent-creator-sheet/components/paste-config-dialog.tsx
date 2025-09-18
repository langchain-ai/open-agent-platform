"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function PasteConfigDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string) => Promise<boolean>;
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

  const handleSubmit = async () => {
    const success = await onSubmit(text);
    if (success) {
      setText("");
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleClose}
    >
      <AlertDialogContent className="sm:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Paste Agent Configuration</AlertDialogTitle>
          <AlertDialogDescription>
            Paste the JSON configuration to import. It should include metadata
            and a config.configurable object.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE_CONFIG_PLACEHOLDER}
          className="min-h-64 font-mono"
        />
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <Button onClick={handleSubmit}>Submit</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
