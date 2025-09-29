import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Agent Platform",
  description: "Open Agent Platform by LangChain",
};

export default function Layout({
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
        <main>{children}</main>
      </body>
    </html>
  );
}
