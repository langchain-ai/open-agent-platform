"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap } from "lucide-react";
import type { GroupedTriggerRegistrationsByProvider } from "@/types/triggers";
import Loading from "@/components/ui/loading";
import { TriggerAccordionItem } from "./components/trigger-accordion-item";
import { Accordion } from "@/components/ui/accordion";

type TriggersInterfaceProps = {
  groupedTriggers?: GroupedTriggerRegistrationsByProvider;
  loading?: boolean;
  showTriggersTab?: boolean;
  onRefresh?: () => void;
};

export default function TriggersInterface({
  groupedTriggers,
  loading = false,
  showTriggersTab,
  onRefresh,
}: TriggersInterfaceProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Loading Triggers
          </CardTitle>
          <CardDescription>Loading triggers…</CardDescription>
        </CardHeader>
        <CardContent>
          <Loading label="Loading triggers" />
        </CardContent>
      </Card>
    );
  }

  // Feature disabled: show coming soon (tab still visible per UX)
  if (showTriggersTab === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Coming soon
          </CardTitle>
          <CardDescription>
            This feature is under development and will be released soon. Stay
            tuned!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!groupedTriggers || Object.keys(groupedTriggers).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            No Triggers Available
          </CardTitle>
          <CardDescription>
            No triggers are currently configured. Please set up the
            NEXT_PUBLIC_TRIGGERS_API_URL environment variable to enable
            triggers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Zap className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Configure Triggers</h3>
            <p className="text-muted-foreground mt-2">
              Add trigger configurations to your environment variables to get
              started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Triggers</h2>
          <p className="text-muted-foreground">
            Authenticate with the following apps and set up triggers to
            automatically activate your agents.
          </p>
        </div>
      </div>

      <Accordion
        type="multiple"
        className="w-full"
      >
        {Object.entries(groupedTriggers).map(
          ([provider, { registrations, triggers }]) => (
            <TriggerAccordionItem
              key={provider}
              provider={provider}
              groupedRegistrations={registrations}
              triggers={triggers}
              onRefresh={onRefresh}
            />
          ),
        )}
      </Accordion>
    </div>
  );
}
