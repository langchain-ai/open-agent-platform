import type { NextRequest } from "next/server";
import { updateSession } from "./lib/auth/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Skip middleware for static assets and endpoints that handle auth
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",

    /*
     * Match all API routes except for auth-related ones
     * This allows the middleware to run on API routes and check authentication
     */
    "/api/((?!auth).*)",
  ],
};
