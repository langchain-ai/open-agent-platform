"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TriggerForm } from "./trigger-form";
import type { Trigger } from "@/types/triggers";
import { Zap, ChevronDown } from "lucide-react";
import { ListTriggerRegistrationsData } from "@/hooks/use-triggers";
import { ResourceRenderer } from "./resource-renderer";
import { cn } from "@/lib/utils";

interface TriggerCardProps {
  trigger: Trigger;
  userTriggers: ListTriggerRegistrationsData[];
}

function ConfiguredAccounts(props: {
  userTriggers: ListTriggerRegistrationsData[];
}) {
  const { userTriggers } = props;
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
        className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-between text-left text-sm font-medium transition-colors"
      >
        <span>Configured Accounts ({userTriggers.length})</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isAccountsExpanded && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isAccountsExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-1 pt-2">
          {userTriggers.map((userTrigger) => (
            <div
              key={userTrigger.id}
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <div className="bg-muted-foreground h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <ResourceRenderer resource={userTrigger.resource} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TriggerCard({ trigger, userTriggers }: TriggerCardProps) {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <TriggerForm
        trigger={trigger}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {trigger.displayName}
        </CardTitle>
        {trigger.description && (
          <CardDescription>{trigger.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {userTriggers.length > 0 && (
            <ConfiguredAccounts userTriggers={userTriggers} />
          )}
          <Button
            onClick={() => setShowForm(true)}
            className="w-full"
          >
            Register {trigger.displayName}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
