import { Trigger } from "@/types/triggers";
import { toast } from "sonner";

type RegisterTriggerResponse =
  | {
      success: boolean;
      registered: false;
      auth_required: true;
      auth_url: string;
      auth_id: string;
      provider: string;
    }
  | {
      success: boolean;
      registered: true;
    };

export interface ListUserTriggersData {
  id: string;
  user_id: string;
  template_id: string;
  resource: unknown;
  linked_assistant_ids?: string[];
  created_at: string;
}

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

  const listUserTriggers = async (
    accessToken: string,
  ): Promise<ListUserTriggersData[] | undefined> => {
    const triggersApiUrl = constructTriggerUrl("/api/triggers/registrations");
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
      fieldSelections?: Record<string, Record<string, boolean>>;
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

      const body: any = {};
      
      // Add field selection if provided for this trigger
      if (args.fieldSelections?.[triggerId]) {
        body.field_selection = args.fieldSelections[triggerId];
      }

      const response = await fetch(triggerApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
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
    },
  ): Promise<boolean> => {
    // For RESTful API, we need to update each registration individually
    for (const triggerId of args.selectedTriggerIds) {
      const triggerApiUrl = constructTriggerUrl(
        `/api/triggers/registrations/${triggerId}/assistants`,
      );
      if (!triggerApiUrl) {
        return false;
      }

      const response = await fetch(triggerApiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistant_id: args.agentId,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to update agent triggers", {
          richColors: true,
        });
        return false;
      }
    }

    return true;
  };

  return {
    listTriggers,
    listUserTriggers,
    registerTrigger,
    setupAgentTrigger,
    updateAgentTriggers,
  };
}
