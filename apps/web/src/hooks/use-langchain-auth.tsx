export function useLangChainAuth() {
  const verifyUserAuthScopes = async (accessToken: string, args: {
    providerId: string, scopes: string[]
  }): Promise<boolean | string> => {
    const { providerId, scopes } = args;
    if (!process.env.NEXT_PUBLIC_BASE_API_URL) {
      throw new Error("No base API URL found");
    }

    const url = new URL(process.env.NEXT_PUBLIC_BASE_API_URL)
    url.pathname += `/langchain-auth/verify-user-auth-scopes`
    url.searchParams.set("providerId", providerId)
    url.searchParams.set("scopes", scopes.join(","))
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": accessToken,
      },
    });
    const data = await res.json();
    if (data.success) {
      return true;
    }
    return data.authUrl;
  }

  return {
    verifyUserAuthScopes,
  }
}