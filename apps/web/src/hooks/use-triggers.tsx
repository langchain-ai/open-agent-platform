import { Trigger } from "@/types/triggers";
import { toast } from "sonner";

type RegisterTriggerResponse =
  | {
      authUrl: string;
      registered: false;
    }
  | {
      registered: true;
    };

export interface ListUserTriggersData {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
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
          ? JSON.stringify(args.payload)
          : undefined,
    });

    if (!response.ok) {
      toast.error("Failed to register trigger", {
        richColors: true,
      });
      return;
    }

    return response.json();
  };

  return {
    listTriggers,
    listUserTriggers,
    registerTrigger,
  };
}
