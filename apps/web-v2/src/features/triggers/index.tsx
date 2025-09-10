"use client";

import { useAuthContext } from "@/providers/Auth";
import { TriggerCard } from "./components/trigger-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap } from "lucide-react";
import {
  ListTriggerRegistrationsData,
  useTriggers,
} from "@/hooks/use-triggers";
import { useEffect, useState } from "react";
import type { Trigger } from "@/types/triggers";
import { toast } from "sonner";
import { groupUserRegisteredTriggersByProvider } from "@/lib/triggers";
import Loading from "@/components/ui/loading";
import { useFlags } from "launchdarkly-react-client-sdk";

export default function TriggersInterface() {
  const [triggersLoading, setTriggersLoading] = useState(true);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [userTriggers, setUserTriggers] = useState<
    ListTriggerRegistrationsData[]
  >([]);
  const auth = useAuthContext();
  const { listTriggers, listUserTriggers } = useTriggers();
  const { showTriggersTab } = useFlags<{ showTriggersTab?: boolean }>();

  useEffect(() => {
    // Wait for flag to resolve; show loader meanwhile
    if (showTriggersTab === false) {
      // Do not fetch when disabled
      setTriggersLoading(false);
      return;
    }
    if (showTriggersTab === undefined) {
      // keep loading while flag initializes
      return;
    }
    if (!auth.session?.accessToken) return;
    setTriggersLoading(true);
    listTriggers(auth.session?.accessToken)
      .then((listTriggersRes) => {
        if (!listTriggersRes) {
          toast.warning("No triggers found", {
            richColors: true,
          });
          return;
        }
        setTriggers(listTriggersRes);
      })
      .finally(() => {
        setTriggersLoading(false);
      });
    listUserTriggers(auth.session?.accessToken)
      .then((listUserTriggersRes) => {
        if (!listUserTriggersRes) {
          // User has not registered any triggers
          return;
        }
        setUserTriggers(listUserTriggersRes);
      })
      .finally(() => {
        setTriggersLoading(false);
      });
  }, [auth.session?.accessToken, showTriggersTab]);

  if (triggersLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Triggers</h2>
            <p className="text-muted-foreground">
              Set up triggers to automatically activate your agents
            </p>
          </div>
        </div>

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
      </div>
    );
  }

  // Feature disabled: show coming soon (tab still visible per UX)
  if (showTriggersTab === false) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Triggers</h2>
            <p className="text-muted-foreground">
              Set up triggers to automatically activate your agents
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Coming soon
            </CardTitle>
            <CardDescription>
              This feature is under development and will be released. Stay
              tuned!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (triggers.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Triggers</h2>
            <p className="text-muted-foreground">
              Set up triggers to automatically activate your agents
            </p>
          </div>
        </div>

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
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Triggers</h2>
          <p className="text-muted-foreground">
            Set up triggers to automatically activate your agents
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {triggers.map((trigger) => (
          <TriggerCard
            key={trigger.id}
            trigger={trigger}
            userTriggers={
              groupUserRegisteredTriggersByProvider(userTriggers)?.[
                trigger.id
              ] || []
            }
          />
        ))}
      </div>
    </div>
  );
}
