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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { ClipboardPaste } from "lucide-react";

export function PasteConfigDialog(props: {
  onSubmit: (text: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const { onSubmit } = props;
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
    setOpen(nextOpen);
    if (!nextOpen) setText("");
  };

  const handleSubmit = async () => {
    const success = await onSubmit(text);
    if (success) {
      setText("");
      setOpen(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={handleClose}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex w-full items-center justify-center gap-2"
        >
          <ClipboardPaste className="size-4" />
          Paste
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle>Paste Agent Configuration</AlertDialogTitle>
          <AlertDialogDescription>
            Paste the JSON configuration to import. It should include metadata
            and a config.configurable object.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex-1 overflow-auto">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLE_CONFIG_PLACEHOLDER}
            className="h-full min-h-64 resize-none font-mono"
          />
        </div>
        <AlertDialogFooter className="shrink-0">
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <Button onClick={handleSubmit}>Submit</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
