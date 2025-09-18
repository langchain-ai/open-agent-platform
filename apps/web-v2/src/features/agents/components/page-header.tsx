import type React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AgentCreatorSheet } from "@/components/agent-creator-sheet";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action || (
        <AgentCreatorSheet
          trigger={
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          }
        />
      )}
    </div>
  );
}
