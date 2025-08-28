import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";

export function useTriggers() {
  const auth = useAuthContext();

  const listTriggers = async () => {};

  const listUserTriggers = async () => {};

  const registerTrigger = async (args: {
    triggerId: string;
    payload: Record<string, any>;
  }) => {
    if (!auth.session?.accessToken) {
      toast.error("No access token found", {
        richColors: true,
      });
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API_URL}/triggers/${args.triggerId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.session.accessToken}`,
        },
        body: JSON.stringify(args.payload),
      },
    );

    if (!response.ok) {
      toast.error("Failed to register trigger", {
        richColors: true,
      });
      return;
    }

    toast.success("Trigger registered successfully", {
      richColors: true,
    });
  };
}
