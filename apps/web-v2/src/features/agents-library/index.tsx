"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentsInterface from "@/features/agents";
import TriggersInterface from "@/features/triggers";
import { useAuthContext } from "@/providers/Auth";
import { AgentsProvider } from "@/providers/Agents";
import type {
  GroupedTriggerRegistrationsByProvider,
  ListTriggerRegistrationsData,
  Trigger,
} from "@/types/triggers";
import { useTriggers } from "@/hooks/use-triggers";
import { groupTriggerRegistrationsByProvider } from "@/lib/triggers";
import { useFlags } from "launchdarkly-react-client-sdk";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";

export default function AgentsLibrary(): React.ReactNode {
  const { session } = useAuthContext();
  const { listTriggers, listUserTriggers } = useTriggers();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();

  const [triggers, setTriggers] = useState<Trigger[] | undefined>();
  const [registrations, setRegistrations] = useState<
    ListTriggerRegistrationsData[] | undefined
  >();
  const [triggersLoading, setTriggersLoading] = useState<boolean>(true);

  const groupedTriggers: GroupedTriggerRegistrationsByProvider | undefined =
    useMemo(() => {
      if (!registrations || !triggers) return undefined;
      return groupTriggerRegistrationsByProvider(registrations, triggers);
    }, [registrations, triggers]);

  useEffect(() => {
    if (showTriggersTab === false || showTriggersTab === undefined) {
      setTriggersLoading(false);
      return;
    }
    if (!session?.accessToken) return;
    setTriggersLoading(true);
    Promise.all([
      listTriggers(session.accessToken),
      listUserTriggers(session.accessToken),
    ])
      .then(([t, r]) => {
        setTriggers(t);
        setRegistrations(r);
      })
      .finally(() => setTriggersLoading(false));
  }, [session?.accessToken, showTriggersTab]);

  return (
    <AgentsProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agent Library</h2>
          </div>
        </div>

        <Tabs
          defaultValue="agents"
          className="w-full"
        >
          <div className="flex items-center gap-8">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="agents"
                className="text-muted-foreground data-[state=active]:text-foreground after:bg-muted-foreground/30 data-[state=active]:after:bg-foreground relative border-none bg-transparent px-0 py-2 text-sm font-medium after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:content-[''] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-none data-[state=active]:after:h-1"
              >
                My Agents
              </TabsTrigger>
              <TabsTrigger
                value="triggers"
                className="text-muted-foreground data-[state=active]:text-foreground after:bg-muted-foreground/30 data-[state=active]:after:bg-foreground relative ml-8 border-none bg-transparent px-0 py-2 text-sm font-medium after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:content-[''] focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-none data-[state=active]:after:h-1"
              >
                Triggers
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="agents"
            className="mt-6"
          >
            <AgentsInterface />
          </TabsContent>
          <TabsContent
            value="triggers"
            className="mt-6"
          >
            <TriggersInterface
              groupedTriggers={groupedTriggers}
              loading={triggersLoading}
              showTriggersTab={showTriggersTab}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AgentsProvider>
  );
}
