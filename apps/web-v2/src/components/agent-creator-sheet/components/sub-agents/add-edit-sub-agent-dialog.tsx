import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SubAgent } from "@/types/sub-agent";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { SubAgentForm, subAgentFormSchema } from "./form";

export function AddEditSubAgentDialog(props: {
  onSubmit: (subAgent: SubAgent) => void;
  subAgent?: SubAgent;
  isEditing?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [interruptConfig, setInterruptConfig] = useState<{
    [toolName: string]: {
      allow_accept: boolean;
      allow_respond: boolean;
      allow_edit: boolean;
      allow_ignore: boolean;
    };
  }>({});
  const form = useForm<z.infer<typeof subAgentFormSchema>>({
    defaultValues: {
      name: props.subAgent?.name || "",
      description: props.subAgent?.description || "",
      prompt: props.subAgent?.prompt || "",
      tools: props.subAgent?.tools || [],
      mcp_server:
        (props.subAgent as any)?.mcp_server ||
        process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
        "",
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          {props.isEditing ? "Edit" : "Add"} Sub-agent
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[85%] min-w-[50%]">
        <DialogHeader>
          <DialogTitle>
            {props.isEditing ? "Edit" : "Add"} sub-agent
          </DialogTitle>
          <DialogDescription>
            Create a new sub-agent for your agent to use.
          </DialogDescription>
        </DialogHeader>
        <div className="scrollbar-pretty-auto h-full pr-2">
          <SubAgentForm
            form={form}
            onSubmit={(v) => {
              // Preserve existing mcp_server or apply default
              const merged = {
                ...(props.subAgent || {}),
                ...v,
                mcp_server:
                  (props.subAgent as any)?.mcp_server ||
                  v.mcp_server ||
                  process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
                  "",
              } as SubAgent;
              props.onSubmit(merged);
              setOpen(false);
            }}
            interruptConfig={interruptConfig}
            setInterruptConfig={setInterruptConfig}
            isEditing={props.isEditing}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
