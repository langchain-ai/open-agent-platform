import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tool } from "@/types/tool";
import { ReactNode } from "react";
import { SchemaRenderer } from "./schema-renderer";
import { ToolMetadataView } from "../tool-metadata-view";
import _ from "lodash";

interface ToolDetailsDialogProps {
  tool: Tool;
  children: ReactNode;
}

export function ToolDetailsDialog({ tool, children }: ToolDetailsDialogProps) {
  const hasAgentModes =
    tool.metadata?.agent_prompts?.available_templates &&
    tool.metadata.agent_prompts.available_templates.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            <span className="text-muted-foreground font-medium">
              Tool Details -{" "}
            </span>
            {_.startCase(tool.name)}
          </DialogTitle>
          <DialogDescription>
            {tool.description || "No description provided"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="schema"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger
              value="modes"
              disabled={!hasAgentModes}
            >
              Agent Modes{" "}
              {hasAgentModes &&
                `(${tool.metadata!.agent_prompts!.available_templates!.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="schema"
            className="mt-4"
          >
            <SchemaRenderer schema={tool.inputSchema} />
          </TabsContent>

          <TabsContent
            value="modes"
            className="mt-4"
          >
            {hasAgentModes ? (
              <ToolMetadataView tool={tool} />
            ) : (
              <p className="text-muted-foreground text-sm">
                No agent modes available for this tool.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
