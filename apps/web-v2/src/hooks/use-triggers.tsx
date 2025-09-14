import { ListTriggerRegistrationsData, Trigger } from "@/types/triggers";
import { toast } from "sonner";

type RegisterTriggerResponse =
  | {
      success: boolean;
      registered: false;
      auth_required: true;
      auth_url: string;
      auth_id: string;
    }
  | {
      success: boolean;
      registered: true;
    }
  | {
      authUrl: string;
      registered: false;
    };

const constructTriggerUrl = (
  path: string,
  queryParams?: Record<string, string>,
) => {
  try {
    const triggerApiUrl = process.env.NEXT_PUBLIC_TRIGGERS_API_URL;
    if (!triggerApiUrl) {
      toast.error("No trigger API URL found", {
        richColors: true,
      });
      return;
    }

    const url = new URL(triggerApiUrl);
    url.pathname = path;

    if (queryParams) {
      Object.entries(queryParams).forEach(([k, v]) => {
        url.searchParams.set(k, v);
      });
    }

    return url.toString();
  } catch {
    toast.error("Failed to construct trigger URL", {
      richColors: true,
    });
    return;
  }
};

export function useTriggers() {
  const listTriggers = async (
    accessToken: string,
  ): Promise<Trigger[] | undefined> => {
    const triggerApiUrl = constructTriggerUrl("/api/triggers");
    if (!triggerApiUrl) {
      return;
    }

    const response = await fetch(triggerApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      toast.error("Failed to list triggers", {
        richColors: true,
      });
      return;
    }

    const triggers = await response.json();
    return triggers.data;
  };

  const listTriggerRegistrations = async (
    accessToken: string,
  ): Promise<ListTriggerRegistrationsData[] | undefined> => {
    const triggersApiUrl = constructTriggerUrl("/api/user-triggers");
    if (!triggersApiUrl) {
      return;
    }

    const response = await fetch(triggersApiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      toast.error("Failed to list user triggers", {
        richColors: true,
      });
      return;
    }

    const triggers = await response.json();
    return triggers.data;
  };

  const registerTrigger = async (
    accessToken: string,
    args: {
      id: string;
      payload: Record<string, any>;
      method: "POST" | "GET";
      path: string;
    },
  ): Promise<RegisterTriggerResponse | undefined> => {
    const triggerApiUrl = constructTriggerUrl(args.path);
    if (!triggerApiUrl) {
      return;
    }

    const response = await fetch(triggerApiUrl, {
      method: args.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body:
        Object.keys(args.payload).length > 0
          ? JSON.stringify({
              type: args.id,
              ...args.payload,
            })
          : JSON.stringify({ type: args.id }),
    });

    if (!response.ok) {
      toast.error("Failed to register trigger", {
        richColors: true,
      });
      return;
    }

    return response.json();
  };

  const setupAgentTrigger = async (
    accessToken: string,
    args: {
      selectedTriggerIds: string[];
      agentId: string;
    },
  ): Promise<boolean> => {
    // Link the agent to each selected trigger individually
    for (const triggerId of args.selectedTriggerIds) {
      const triggerApiUrl = constructTriggerUrl(
        `/api/triggers/registrations/${triggerId}/agents/${args.agentId}`,
      );
      if (!triggerApiUrl) {
        return false;
      }

      const response = await fetch(triggerApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        toast.error("Failed to setup agent trigger", {
          richColors: true,
        });
        return false;
      }
    }

    return true;
  };

  const updateAgentTriggers = async (
    accessToken: string,
    args: {
      agentId: string;
      selectedTriggerIds: string[];
      currentTriggerIds?: string[];
    },
  ): Promise<boolean> => {
    const currentTriggerIds = args.currentTriggerIds || [];
    const selectedTriggerIds = args.selectedTriggerIds;

    // Determine which triggers to remove (in current but not in selected)
    const triggersToRemove = currentTriggerIds.filter(
      (id) => !selectedTriggerIds.includes(id),
    );

    // Determine which triggers to add (in selected but not in current)
    const triggersToAdd = selectedTriggerIds.filter(
      (id) => !currentTriggerIds.includes(id),
    );

    // First, remove unselected trigger links
    for (const triggerId of triggersToRemove) {
      const triggerApiUrl = constructTriggerUrl(
        `/api/triggers/registrations/${triggerId}/agents/${args.agentId}`,
      );
      if (!triggerApiUrl) {
        continue;
      }

      const response = await fetch(triggerApiUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        toast.error("Failed to remove agent from trigger", {
          richColors: true,
        });
        continue;
      }
    }

    // Then, add new trigger links
    for (const triggerId of triggersToAdd) {
      const triggerApiUrl = constructTriggerUrl(
        `/api/triggers/registrations/${triggerId}/agents/${args.agentId}`,
      );
      if (!triggerApiUrl) {
        continue;
      }

      const response = await fetch(triggerApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistant_id: args.agentId,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to add agent to trigger", {
          richColors: true,
        });
        continue;
      }
    }

    return true;
  };

  return {
    listTriggers,
    listUserTriggers: listTriggerRegistrations,
    registerTrigger,
    setupAgentTrigger,
    updateAgentTriggers,
  };
}
