"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

interface ResponseViewerProps {
  response: any;
  isLoading: boolean;
  errorMessage?: string;
  authRequiredMessage?: React.ReactNode;
}

// Helper function to detect and parse successful tool response format
function parseToolResponse(response: any): {
  isParsedResponse: boolean;
  parsedData?: any;
  originalResponse: any;
} {
  if (
    response &&
    typeof response === "object" &&
    Array.isArray(response.content) &&
    response.content.length > 0 &&
    response.content[0]?.type === "text" &&
    typeof response.content[0]?.text === "string"
  ) {
    try {
      // Try to parse the stringified JSON in the text field
      const parsedData = JSON.parse(response.content[0].text);
      return {
        isParsedResponse: true,
        parsedData,
        originalResponse: response,
      };
    } catch (_error) {
      return {
        isParsedResponse: false,
        originalResponse: response,
      };
    }
  }

  return {
    isParsedResponse: false,
    originalResponse: response,
  };
}

export function ResponseViewer({
  response,
  isLoading,
  errorMessage,
  authRequiredMessage,
}: ResponseViewerProps) {
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

  // Parse the response to check if it's a successful tool response with stringified JSON
  const { isParsedResponse, parsedData, originalResponse } =
    parseToolResponse(response);

  return (
    <div className="space-y-4">
      <div className="h-[600px] rounded-md border">
        <ScrollArea className="h-full">
          {isParsedResponse && parsedData ? (
            <EnhancedToolResponseView
              parsedData={parsedData}
              originalResponse={originalResponse}
            />
          ) : (
            <RawView response={response} />
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// Enhanced component for displaying parsed tool responses
function EnhancedToolResponseView({
  parsedData,
  originalResponse,
}: {
  parsedData: any;
  originalResponse: any;
}) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-4 p-4">
      {/* Toggle buttons */}
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="flex gap-2">
          <Button
            variant={!showRaw ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRaw(false)}
          >
            Parsed Response
          </Button>
          <Button
            variant={showRaw ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRaw(true)}
          >
            Raw Response
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              copyToClipboard(
                JSON.stringify(
                  showRaw ? originalResponse : parsedData,
                  null,
                  2,
                ),
                showRaw ? "raw response" : "parsed response",
              )
            }
          >
            <Copy className="mr-1 h-4 w-4" />
            Copy {showRaw ? "Raw" : "Parsed"}
          </Button>
        </div>
      </div>

      {/* Content display */}
      {showRaw ? (
        <RawView response={originalResponse} />
      ) : (
        <div className="space-y-3">
          <div className="rounded border bg-blue-50 p-2 text-sm text-gray-600">
            <strong>Tool Response:</strong> Showing parsed JSON content from the
            tool's text response
          </div>
          <RawView response={parsedData} />
        </div>
      )}
    </div>
  );
}

function copyToClipboard(text: string, label?: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success(`Copied ${label || "value"} to clipboard`);
    })
    .catch(() => {
      toast.error("Failed to copy to clipboard");
    });
}

// RawView component with enhanced syntax highlighting
function RawView({ response }: { response: any }) {
  const jsonString = JSON.stringify(response, null, 2);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(jsonString, "JSON")}
          className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
      <SyntaxHighlighter
        language="json"
        style={vscDarkPlus}
        showLineNumbers
        lineNumberStyle={{
          color: "#666",
          paddingRight: "1em",
          fontSize: "0.8em",
        }}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "#1e1e1e",
          fontSize: "0.875rem",
        }}
        wrapLongLines
      >
        {jsonString}
      </SyntaxHighlighter>
    </div>
  );
}
