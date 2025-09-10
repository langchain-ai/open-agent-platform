"use client";

import React from "react";

export default function Loading({
  label = "Preparing your workspace",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black" />
      <div className="text-sm text-black">{label}…</div>
    </div>
  );
}
