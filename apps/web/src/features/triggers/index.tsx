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
import { ListUserTriggersData, useTriggers } from "@/hooks/use-triggers";
import { useEffect, useState } from "react";
import type { Trigger } from "@/types/triggers";
import { toast } from "sonner";
import { groupUserRegisteredTriggersByProvider } from "@/lib/environment/triggers";

export default function TriggersInterface() {
  const [triggersLoading, setTriggersLoading] = useState(true);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [userTriggers, setUserTriggers] = useState<ListUserTriggersData[]>([]);
  const auth = useAuthContext();
  const { listTriggers, listUserTriggers } = useTriggers();

  useEffect(() => {
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
  }, [auth.session?.accessToken]);

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
            <CardDescription>Loading triggers...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Zap className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">Loading Triggers</h3>
              <p className="text-muted-foreground mt-2">Loading triggers...</p>
            </div>
          </CardContent>
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
              NEXT_PUBLIC_TRIGGERS_CONFIG environment variable to enable
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
                trigger.providerId
              ] || []
            }
          />
        ))}
      </div>
    </div>
  );
}
