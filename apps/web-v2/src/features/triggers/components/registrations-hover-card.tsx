"use client";

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ResourceRenderer } from "@/components/ui/resource-renderer";
import { ListTriggerRegistrationsData } from "@/types/triggers";
import { Info } from "lucide-react";

export function RegistrationsHoverCard(props: {
  registrations: ListTriggerRegistrationsData[];
}) {
  const { registrations } = props;

  if (!registrations?.length) return null;

  if (registrations.length === 1) {
    return (
      <Badge variant="secondary">
        <ResourceRenderer resource={registrations[0].resource} />
      </Badge>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          variant="secondary"
          className="hover:ring-muted-foreground/30 cursor-help hover:ring-1"
        >
          {registrations.length} Registrations
          <Info className="ml-1 h-3 w-3 opacity-70" />
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <ul className="space-y-2">
          {registrations.map((registration) => (
            <li
              key={registration.id}
              className="flex items-center gap-2 text-sm"
            >
              <div className="bg-muted-foreground h-1.5 w-1.5 flex-shrink-0 rounded-full" />
              <span className="break-words">
                <ResourceRenderer resource={registration.resource} />
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}
