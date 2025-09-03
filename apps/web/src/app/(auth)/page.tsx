"use client";

import React from "react";
import { HomePageInterface } from "@/features/home";

/**
 * The default page (/).
 * Contains the generic chat interface.
 */
export default function HomePage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <HomePageInterface />
    </React.Suspense>
  );
}
