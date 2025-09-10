"use client";

import React from "react";
import { LDProvider } from "launchdarkly-react-client-sdk";
import { useAuthContext } from "@/providers/Auth";

export default function LaunchDarklyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthContext();

  const emailDomain = user?.email ? user.email.split("@")[1] : undefined;

  const context = {
    kind: "user",
    key: user?.id || "anonymous",
    anonymous: !user?.id,
    email: user?.email,
    custom: {
      emailDomain: emailDomain,
    },
  };

  const clientSideID = process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID;
  if (!clientSideID) {
    throw new Error(
      "Missing NEXT_PUBLIC_LD_CLIENT_SIDE_ID. Add it to apps/web-v2/.env.local and your deploy environment.",
    );
  }

  return (
    <LDProvider
      key={user?.id}
      clientSideID={clientSideID}
      context={context}
      reactOptions={{ useCamelCaseFlagKeys: true }}
    >
      {children}
    </LDProvider>
  );
}
