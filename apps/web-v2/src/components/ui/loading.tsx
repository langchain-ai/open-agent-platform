"use client";

import React from "react";
import { LoaderCircle } from "lucide-react";

export default function Loading({
  label = "Preparing your workspace",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 p-8 text-center">
      <LoaderCircle className="h-8 w-8 animate-spin" />
      <div className="text-sm text-black">{label}…</div>
    </div>
  );
}
