"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/providers/Auth";
import {
  useTriggers,
  ListTriggerRegistrationsData,
} from "@/hooks/use-triggers";
import { Trigger } from "@/types/triggers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";

interface CreateAgentTriggersSelectionProps {
  selectedTriggers: string[];
  onTriggersChange: (triggers: string[]) => void;
}

export function CreateAgentTriggersSelection({
  selectedTriggers,
  onTriggersChange,
}: CreateAgentTriggersSelectionProps) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [userTriggers, setUserTriggers] = useState<
    ListTriggerRegistrationsData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuthContext();
  const { listTriggers, listUserTriggers } = useTriggers();

  useEffect(() => {
    if (!auth.session?.accessToken) return;

    setLoading(true);

    // Fetch available triggers
    listTriggers(auth.session.accessToken)
      .then((triggersRes) => {
        if (triggersRes) {
          setTriggers(triggersRes);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch triggers:", error);
        toast.error("Failed to load triggers");
      });

    // Fetch user's registered triggers
    listUserTriggers(auth.session.accessToken)
      .then((userTriggersRes) => {
        if (userTriggersRes) {
          setUserTriggers(userTriggersRes);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch user triggers:", error);
        toast.error("Failed to load user triggers");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auth.session?.accessToken]);

  const handleTriggerToggle = (triggerId: string, checked: boolean) => {
    if (checked) {
      onTriggersChange([...selectedTriggers, triggerId]);
    } else {
      onTriggersChange(selectedTriggers.filter((id) => id !== triggerId));
    }
  };

  const isTriggerRegistered = (triggerId: string) => {
    return userTriggers.some((ut) => ut.template_id === triggerId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <TriggerSelectionCardLoading key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {triggers.map((trigger) => (
          <TriggerSelectionCard
            key={trigger.id}
            trigger={trigger}
            isSelected={selectedTriggers.includes(trigger.id)}
            isRegistered={isTriggerRegistered(trigger.id)}
            onToggle={handleTriggerToggle}
          />
        ))}
      </div>
    </div>
  );
}

interface TriggerSelectionCardProps {
  trigger: Trigger;
  isSelected: boolean;
  isRegistered: boolean;
  onToggle: (triggerId: string, checked: boolean) => void;
}

function TriggerSelectionCard({
  trigger,
  isSelected,
  isRegistered,
  onToggle,
}: TriggerSelectionCardProps) {
  // Get the appropriate icon based on trigger name
  const getTriggerIcon = (triggerName: string) => {
    const name = triggerName.toLowerCase();
    if (name.includes("gmail") || name.includes("google")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center">
          <GoogleIcon />
        </div>
      );
    }
    if (name.includes("slack")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600">
          <span className="text-sm font-bold text-white">S</span>
        </div>
      );
    }
    // Default icon
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500">
        <span className="text-sm font-bold text-white">T</span>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div>{getTriggerIcon(trigger.displayName)}</div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="mb-1 text-gray-700">{trigger.displayName}</h3>
          <p className="text-sm text-gray-600">
            {trigger.description || "No description available"}
          </p>
        </div>

        {/* Setup Button */}
        <Button
          variant="outline"
          size="sm"
          className="border-[#2F6868] text-[#2F6868] hover:bg-[#2F6868]/10"
          onClick={() => {
            // TODO: Implement trigger registration
            toast.info("Trigger registration not yet implemented");
          }}
        >
          Set up
        </Button>
      </div>
    </div>
  );
}

function TriggerSelectionCardLoading() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-4 w-4 animate-pulse rounded bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
