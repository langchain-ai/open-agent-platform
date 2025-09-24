import { useState, useEffect } from "react";
import { useAuthContext } from "@/providers/Auth";

interface OAuthProvider {
  id: string;
  provider_id: string;
  name: string;
  client_id: string;
  auth_url: string;
  token_url: string;
  uses_pkce: boolean;
  code_challenge_method: string | null;
  created_at: string;
  updated_at: string;
}

export function useOAuthProviders() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthContext();

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/langchain-auth/providers", {
          headers: {
            "x-access-token": session.accessToken,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch providers: ${response.status}`);
        }

        const data = await response.json();
        setProviders(data.providers || []);
      } catch (err) {
        console.error("Error fetching OAuth providers:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [session?.accessToken]);

  // Create a mapping from provider ID to display name
  const getProviderDisplayName = (providerId: string): string => {
    const provider = providers.find((p) => p.provider_id === providerId);
    return provider?.name || providerId;
  };

  return {
    providers,
    loading,
    error,
    getProviderDisplayName,
  };
}
