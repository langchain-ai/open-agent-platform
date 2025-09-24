import React from "react";
import AuthLayout from "./auth-layout";
import { AuthProvider } from "@/providers/Auth";
import type { Metadata } from "next";
import "../globals.css";
import VideoBackgroundPageWrapper from "@/components/VideoBackgroundPageWrapper";

export const metadata: Metadata = {
  title: "Open Agent Platform - Auth",
  description: "Open Agent Platform by LangChain",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <VideoBackgroundPageWrapper>
            <AuthLayout>{children}</AuthLayout>
          </VideoBackgroundPageWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
