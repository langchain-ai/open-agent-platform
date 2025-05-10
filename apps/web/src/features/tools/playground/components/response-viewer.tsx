"use client";

import type React from "react";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponseViewerProps {
  response: any;
  isLoading: boolean;
  errorMessage?: string;
  authRequiredMessage?: React.ReactNode;
}

export function ResponseViewer({
  response,
  isLoading,
  errorMessage,
  authRequiredMessage,
}: ResponseViewerProps) {
  const [viewMode, setViewMode] = useState<"pretty" | "raw">("pretty");

  if (authRequiredMessage) {
    return authRequiredMessage;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-red-200 bg-red-50 p-6 text-red-700">
        <AlertTriangle className="mb-3 h-8 w-8 text-red-500" />
        <p className="mb-1 text-lg font-semibold">Error</p>
        <p className="text-center text-sm">{errorMessage}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-teal-600" />
        <p className="text-gray-500">Executing tool...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>No response yet. Run the tool to see results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "pretty" | "raw")}
        className="w-full"
      >
        <TabsList className="grid w-48 grid-cols-2">
          <TabsTrigger value="pretty">Pretty</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        <TabsContent
          value="pretty"
          className="pt-4"
        >
          <PrettyView response={response} />
        </TabsContent>

        <TabsContent
          value="raw"
          className="pt-4"
        >
          <RawView response={response} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrettyView({ response }: { response: any }) {
  return (
    <div className="rounded-md border bg-gray-50 p-4">
      {renderValue(response, true)}
    </div>
  );
}

// Add an isRoot parameter to avoid wrapping the top-level object in unnecessary borders/padding
function renderValue(value: any, isRoot = false): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof value === "object" && Array.isArray(value)) {
    return (
      <div
        className={cn(!isRoot && "space-y-1 border-l-2 border-gray-200 pl-3")}
      >
        {value.length === 0 ? (
          <span className="text-gray-400">[] (Empty array)</span>
        ) : (
          value.map((item, index) => <div key={index}>{renderValue(item)}</div>)
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <div
        className={cn(
          "space-y-1",
          !isRoot && "border-l-2 border-gray-200 pl-3",
        )}
      >
        {entries.length === 0 ? (
          <span className="text-gray-400">{"{{}} (Empty object)"}</span>
        ) : (
          entries.map(([k, v]) => {
            // Determine if the value itself will render a container (object or array)
            const valueRendersContainer = typeof v === "object" && v !== null;
            return (
              <div
                key={k}
                className="flex flex-wrap gap-x-2"
              >
                <span className="font-medium text-gray-700">{k}:</span>
                {/* Render value directly if it's an object/array, otherwise wrap primitives */}
                {valueRendersContainer ? (
                  renderValue(v, false) // Pass false for isRoot
                ) : (
                  <div className="flex-1">{renderValue(v, false)}</div> // Pass false for isRoot
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span
        className={cn("font-mono", value ? "text-green-600" : "text-red-600")}
      >
        {String(value)}
      </span>
    );
  }

  if (typeof value === "number") {
    return <span className="font-mono text-blue-600">{value}</span>;
  }

  return <span className="font-mono">{String(value)}</span>;
}

function RawView({ response }: { response: any }) {
  return (
    <pre className="overflow-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
      {JSON.stringify(response, null, 2)}
    </pre>
  );
}
