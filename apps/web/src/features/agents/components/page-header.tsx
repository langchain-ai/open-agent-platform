import type React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import { CreateAgentDialog } from "./create-edit-agent-dialogs/create-agent-dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const [showCreateAgentDialog, setShowCreateAgentDialog] = useState(false);
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action || (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push("/onboarding")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Guided Setup
          </Button>
          <Button onClick={() => setShowCreateAgentDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>
      )}

      <CreateAgentDialog
        open={showCreateAgentDialog}
        onOpenChange={setShowCreateAgentDialog}
      />
    </div>
  );
}
