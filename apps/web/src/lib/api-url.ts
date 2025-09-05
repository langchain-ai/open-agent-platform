/**
 * Get the API URL for the current environment. Includes the `/api` path.
 * It defaults to the `NEXT_PUBLIC_VERCEL_URL` environment variable which
 * is automatically injected into the environment when deployed to Vercel.
 * If the `NEXT_PUBLIC_VERCEL_URL` is not set, it defaults to `http://localhost:3000`.
 *
 * @returns The API URL for the current environment.
 */
export function getApiUrl() {
  const fallbackLocalUrl = "http://localhost:3000";

  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  let vercelUrl: string | undefined;
  if (vercelEnv) {
    vercelUrl =
      vercelEnv === "production"
        ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
        : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL;
    vercelUrl = vercelUrl ? `https://${vercelUrl}` : undefined;
  }

  try {
    const baseUrl = new URL(vercelUrl ?? fallbackLocalUrl);
    baseUrl.pathname = "/api";
    return baseUrl.toString();
  } catch {
    // Add a catch in case the NEXT_PUBLIC_VERCEL_URL is invalid and throws an error
    const baseUrl = new URL(fallbackLocalUrl);
    baseUrl.pathname = "/api";
    return baseUrl.toString();
  }
}
