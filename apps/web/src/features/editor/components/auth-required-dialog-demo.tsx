"use client";

import React from "react";
import { AuthRequiredDialog } from "@/components/agent-creator-sheet/components/auth-required-dialog";
import type { GroupedTriggerRegistrationsByProvider } from "@/types/triggers";

export function AuthRequiredDialogDemo(): React.ReactNode {
  const [open, setOpen] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const authUrls = React.useMemo(
    () => [
      {
        provider: "gmail",
        authUrl: "/api/oauth/mock?provider=gmail",
        tools: ["gmail_send_email"],
      },
    ],
    [],
  );

  // Minimal mocked triggers data to visualize UI selections
  const groupedTriggers: GroupedTriggerRegistrationsByProvider = {
    slack: {
      triggers: [
        {
          id: "slack_read_channel",
          provider: "slack",
          displayName: "Slack: Read Channel",
          description: "Fires when messages are posted in a channel.",
          path: "/api/triggers/slack/read_channel",
          method: "POST",
          payloadSchema: { channel: { type: "string" } },
          requireDisplayName: false,
        },
      ],
      registrations: {
        slack_read_channel: [
          {
            id: "reg-slack-general",
            user_id: "demo-user",
            template_id: "slack_read_channel",
            resource: { channel: "#general" },
            linked_agent_ids: [],
            created_at: new Date().toISOString(),
          },
          {
            id: "reg-slack-random",
            user_id: "demo-user",
            template_id: "slack_read_channel",
            resource: { channel: "#random" },
            linked_agent_ids: [],
            created_at: new Date().toISOString(),
          },
        ],
      },
    },
    gmail: {
      // No demo triggers for Gmail; tool is represented via authUrls above
      triggers: [],
      registrations: {},
    },
  };

  return (
    <AuthRequiredDialog
      open={open}
      onOpenChange={setOpen}
      handleSubmit={() => setOpen(false)}
      authUrls={authUrls}
      groupedTriggers={groupedTriggers}
      reloadTriggers={async () => {}}
      selectedTriggerRegistrationIds={selectedIds}
      onSelectedTriggerRegistrationIdsChange={setSelectedIds}
    />
  );
}
