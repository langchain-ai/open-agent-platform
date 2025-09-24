"use client";

import DebugAuthInterface from "@/features/debug-auth";
import { AuthProvider } from "@/providers/Auth";

export default function DebugAuthPage() {
  return (
    <AuthProvider>
      <div className="mx-auto flex flex-col items-center px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">Authentication Debug</h1>
        <p className="text-muted-foreground mb-4">
          This page allows you to debug the current authentication state. It is
          only accessible in development mode.
        </p>

        <DebugAuthInterface />

        <div className="bg-muted/30 mt-8 rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-medium">Testing Tips</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Use the Sign Out button to clear your current session</li>
            <li>Check your browser's developer tools to inspect cookies</li>
            <li>
              Look for cookies starting with{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-sm">sb-</code>
            </li>
            <li>Use incognito/private browsing for testing new sign-ups</li>
          </ul>
        </div>
      </div>
    </AuthProvider>
  );
}
