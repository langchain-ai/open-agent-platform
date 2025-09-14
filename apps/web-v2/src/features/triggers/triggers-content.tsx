"use client";

import { useAuthContext } from "@/providers/Auth";
import { useTriggers } from "@/hooks/use-triggers";
import { useEffect, useState } from "react";
import type { GroupedTriggerRegistrationsByProvider } from "@/types/triggers";
import { toast } from "sonner";
import { groupTriggerRegistrationsByProvider } from "@/lib/triggers";
import { useFlags } from "launchdarkly-react-client-sdk";
import { LaunchDarklyFeatureFlags } from "@/types/launch-darkly";
import { TriggerAccordionItem } from "./components/trigger-accordion-item";
import { Accordion } from "@/components/ui/accordion";

export function TriggersContent() {
  const [triggersLoading, setTriggersLoading] = useState(true);
  const [groupedTriggers, setGroupedTriggers] =
    useState<GroupedTriggerRegistrationsByProvider>();
  const auth = useAuthContext();
  const { listTriggers, listUserTriggers } = useTriggers();
  const { showTriggersTab } = useFlags<LaunchDarklyFeatureFlags>();

  useEffect(() => {
    if (showTriggersTab === false) {
      setTriggersLoading(false);
      return;
    }
    if (showTriggersTab === undefined) {
      setTriggersLoading(false);
      return;
    }
    if (!auth.session?.accessToken) return;
    setTriggersLoading(true);

    async function fetchTriggersAndRegistrations(accessToken: string) {
      const [triggers, registrations] = await Promise.all([
        listTriggers(accessToken),
        listUserTriggers(accessToken),
      ]);
      if (!triggers) {
        toast.warning("No triggers found", {
          richColors: true,
        });
        return;
      }
      if (!registrations) {
        return;
      }
      setGroupedTriggers(
        groupTriggerRegistrationsByProvider(registrations, triggers),
      );
    }

    fetchTriggersAndRegistrations(auth.session.accessToken).finally(() => {
      setTriggersLoading(false);
    });
  }, [auth.session?.accessToken, showTriggersTab]);

  if (triggersLoading) {
    return (
      <div className="py-8 text-center">
        <div className="text-sm text-gray-500">Loading triggers...</div>
      </div>
    );
  }

  if (showTriggersTab === false) {
    return (
      <div className="py-8 text-center">
        <div className="text-sm text-gray-500">
          Triggers feature coming soon
        </div>
      </div>
    );
  }

  if (!groupedTriggers || Object.keys(groupedTriggers).length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="text-sm text-gray-500">
          No triggers are currently configured. Please set up the
          NEXT_PUBLIC_TRIGGERS_API_URL environment variable to enable triggers.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            />
          ),
        )}
      </Accordion>
    </div>
  );
}
