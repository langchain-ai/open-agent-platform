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
  try {
    const baseUrl = new URL(
      process.env.NEXT_PUBLIC_VERCEL_URL ?? fallbackLocalUrl,
    );
    baseUrl.pathname = "/api";
    return baseUrl.toString();
  } catch {
    // Add a catch in case the NEXT_PUBLIC_VERCEL_URL is invalid and throws an error
    const baseUrl = new URL(fallbackLocalUrl);
    baseUrl.pathname = "/api";
    return baseUrl.toString();
  }
}
