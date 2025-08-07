"use client";

import { MultiServerMCPProvider } from "@/providers/MultiServerMCP";
import React from "react";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MultiServerMCPProvider>{children}</MultiServerMCPProvider>;
}
