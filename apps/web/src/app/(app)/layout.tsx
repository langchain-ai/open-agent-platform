import type { Metadata } from "next";
import "../globals.css";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthProvider } from "@/providers/Auth";
import { AuthenticatedApp } from "@/components/AuthenticatedApp";

export const metadata: Metadata = {
  title: "Open Agent Platform",
  description: "Open Agent Platform by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV !== "production" && isDebugMode && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
      </head>
      <body>
        <NuqsAdapter>
          <AuthProvider>
            <AuthenticatedApp>{children}</AuthenticatedApp>
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
