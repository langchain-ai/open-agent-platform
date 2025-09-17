import type { Metadata } from "next";
import "../globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SidebarLayout } from "@/components/sidebar";
import { AuthProvider } from "@/providers/Auth";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Open Agent Platform",
  description: "Open Agent Platform by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV !== "production" && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
      </head>
      <body className={inter.className}>
        <NuqsAdapter>
          <AuthProvider>
            <SidebarLayout>{children}</SidebarLayout>
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
