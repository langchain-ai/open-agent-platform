import React from "react";
import AuthLayout from "./auth-layout";
import { AuthProvider } from "@/providers/Auth";
import type { Metadata } from "next";
import "../globals.css";
import { DOCS_LINK } from "@/constants";
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
  const isDemoApp = process.env.NEXT_PUBLIC_DEMO_APP === "true";
  return (
    <html lang="en">
      <body>
        {isDemoApp && (
          <div className="fixed top-0 right-0 left-0 z-10 bg-[#CFC8FE] py-2 text-center text-black shadow-md">
            You're currently using the demo application. To use your own agents,
            and run in production, check out the{" "}
            <a
              className="underline underline-offset-2"
              href={DOCS_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              documentation
            </a>
          </div>
        )}
        <AuthProvider>
          <VideoBackgroundPageWrapper>
            <AuthLayout>{children}</AuthLayout>
          </VideoBackgroundPageWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
