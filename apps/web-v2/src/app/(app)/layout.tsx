import type { Metadata } from "next";
import "../globals.css";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SidebarLayout } from "@/components/sidebar";
import { AuthProvider } from "@/providers/Auth";

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
            <SidebarLayout>{children}</SidebarLayout>
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
