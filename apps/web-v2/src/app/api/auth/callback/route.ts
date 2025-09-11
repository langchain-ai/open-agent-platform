import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/auth/supabase-client";

export async function GET(request: NextRequest) {
  try {
    // Parse the URL and get the code parameter
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    // Get the redirect destination (or default to home)
    const redirectTo = requestUrl.searchParams.get("redirect") || "/";

    if (code) {
      // Get Supabase client
      const supabase = getSupabaseClient();

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        throw error;
      }

      // Successfully authenticated
    }

    // Redirect to the requested page or home
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("Auth callback error:", error);

    // In case of error, redirect to sign-in with error message
    const errorUrl = new URL("/signin", request.url);
    errorUrl.searchParams.set(
      "error",
      "Authentication failed. Please try again.",
    );

    return NextResponse.redirect(errorUrl);
  }
}
