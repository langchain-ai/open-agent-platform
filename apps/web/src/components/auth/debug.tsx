"use client";

import { useAuthContext } from "@/providers/Auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Debug component for authentication state
 * Only use during development
 */
export function AuthDebug() {
  const { user, session, isAuthenticated, isLoading, signOut } =
    useAuthContext();
  const [showDetails, setShowDetails] = useState(false);

  // Only enable in development mode
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Card className="mt-6 max-w-lg">
      <CardHeader>
        <CardTitle className="text-lg">Auth Debug Panel</CardTitle>
        <CardDescription>
          This panel shows the current authentication state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <span className="font-medium">Auth Status:</span>
          <span>
            {isLoading
              ? "Loading..."
              : isAuthenticated
                ? "Authenticated ✅"
                : "Not Authenticated ❌"}
          </span>

          <span className="font-medium">User ID:</span>
          <span>{user?.id || "None"}</span>

          <span className="font-medium">Email:</span>
          <span>{user?.email || "None"}</span>

          <span className="font-medium">Display Name:</span>
          <span>{user?.displayName || "None"}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>

          {isAuthenticated && (
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await signOut();
              }}
            >
              Sign Out
            </Button>
          )}
        </div>

        {showDetails && (
          <Alert>
            <AlertDescription>
              <div className="max-h-48 overflow-auto text-xs">
                <pre>Session: {JSON.stringify(session, null, 2)}</pre>
                <pre>User: {JSON.stringify(user, null, 2)}</pre>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert variant="destructive">
          <AlertDescription>
            This panel is only visible in development mode.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
