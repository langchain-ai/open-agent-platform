"use client";

import type React from "react";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { 
  Loader2, 
  AlertTriangle, 
  Copy,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ResponseViewerProps {
  response: any;
  isLoading: boolean;
  errorMessage?: string;
  authRequiredMessage?: React.ReactNode;
}

// Helper function to detect and parse successful tool response format
function parseToolResponse(response: any): { isParsedResponse: boolean; parsedData?: any; originalResponse: any } {
  // Check if response matches the successful tool response format:
  // { "content": [{ "type": "text", "text": "{\"success\": true, ...}" }] }
  if (
    response && 
    typeof response === 'object' &&
    Array.isArray(response.content) &&
    response.content.length > 0 &&
    response.content[0]?.type === 'text' &&
    typeof response.content[0]?.text === 'string'
  ) {
    try {
      // Try to parse the stringified JSON in the text field
      const parsedData = JSON.parse(response.content[0].text);
      return {
        isParsedResponse: true,
        parsedData,
        originalResponse: response
      };
    } catch (error) {
      // If parsing fails, fall back to original response
      return {
        isParsedResponse: false,
        originalResponse: response
      };
    }
  }
  
  return {
    isParsedResponse: false,
    originalResponse: response
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
  const { isParsedResponse, parsedData, originalResponse } = parseToolResponse(response);

  return (
    <div className="space-y-4">
      <div className="border rounded-md h-[600px]">
        <ScrollArea className="h-full">
          {isParsedResponse && parsedData ? (
            <EnhancedToolResponseView parsedData={parsedData} originalResponse={originalResponse} />
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
  originalResponse 
}: { 
  parsedData: any; 
  originalResponse: any; 
}) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="p-4 space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2 items-center justify-between border-b pb-3">
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
            onClick={() => copyToClipboard(
              JSON.stringify(showRaw ? originalResponse : parsedData, null, 2),
              showRaw ? 'raw response' : 'parsed response'
            )}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy {showRaw ? 'Raw' : 'Parsed'}
          </Button>
        </div>
      </div>

      {/* Content display */}
      {showRaw ? (
        <RawView response={originalResponse} />
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded border">
            <strong>Tool Response:</strong> Showing parsed JSON content from the tool's text response
          </div>
          <RawView response={parsedData} />
        </div>
      )}
    </div>
  );
}

// Helper function to copy text to clipboard
function copyToClipboard(text: string, label?: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`Copied ${label || 'value'} to clipboard`);
  }).catch(() => {
    toast.error('Failed to copy to clipboard');
  });
}

// TreeView component with collapsible nodes
function TreeView({ response }: { response: any }) {
  return (
    <div className="space-y-1">
      <TreeNode 
        value={response} 
        isRoot={true} 
        path="" 
        searchTerm=""
      />
    </div>
  );
}

// Individual tree node component
function TreeNode({ 
  value, 
  keyName, 
  isRoot = false, 
  path,
  searchTerm 
}: { 
  value: any; 
  keyName?: string; 
  isRoot?: boolean; 
  path: string;
  searchTerm: string;
}) {
  const [isOpen, setIsOpen] = useState(isRoot || searchTerm.length > 0);
  const currentPath = keyName ? (path ? `${path}.${keyName}` : keyName) : path;

  // Update open state when search term changes
  React.useEffect(() => {
    if (searchTerm.length > 0) {
      // If there's a search term, check if this node or any children match
      const shouldOpen = matchesSearch(value, currentPath, searchTerm);
      setIsOpen(shouldOpen);
    }
  }, [searchTerm, value, currentPath]);

  if (value === null || value === undefined) {
    return (
      <div className="flex items-center gap-2 group">
        {keyName && <span className="font-medium text-gray-700">{keyName}:</span>}
        <span className="text-gray-400 font-mono">null</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
          onClick={() => copyToClipboard('null', keyName)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (typeof value === "object" && Array.isArray(value)) {
    const hasContent = value.length > 0;
    const preview = hasContent ? `[${value.length} items]` : '[]';
    
    return (
      <div className={cn(!isRoot && "ml-4")}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center gap-1 group">
            {hasContent && (
              <CollapsibleTrigger className="flex items-center gap-1 hover:bg-gray-100 rounded p-1">
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </CollapsibleTrigger>
            )}
            {keyName && <span className="font-medium text-gray-700">{keyName}:</span>}
            <span className="text-purple-600 font-mono">{preview}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => copyToClipboard(JSON.stringify(value, null, 2), keyName)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          
          {hasContent && (
            <CollapsibleContent className="space-y-1">
              {value.map((item, index) => (
                <TreeNode
                  key={index}
                  value={item}
                  keyName={`[${index}]`}
                  path={`${currentPath}[${index}]`}
                  searchTerm={searchTerm}
                />
              ))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    const hasContent = entries.length > 0;
    const preview = hasContent ? `{${entries.length} keys}` : '{}';

    return (
      <div className={cn(!isRoot && "ml-4")}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center gap-1 group">
            {hasContent && (
              <CollapsibleTrigger className="flex items-center gap-1 hover:bg-gray-100 rounded p-1">
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </CollapsibleTrigger>
            )}
            {keyName && <span className="font-medium text-gray-700">{keyName}:</span>}
            <span className="text-purple-600 font-mono">{preview}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => copyToClipboard(JSON.stringify(value, null, 2), keyName)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          
          {hasContent && (
            <CollapsibleContent className="space-y-1">
              {entries.map(([k, v]) => (
                <TreeNode
                  key={k}
                  value={v}
                  keyName={k}
                  path={currentPath ? `${currentPath}.${k}` : k}
                  searchTerm={searchTerm}
                />
              ))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  }

  // Primitive values
  const displayValue = typeof value === "string" ? `"${value}"` : String(value);
  const colorClass = getValueColor(value);
  const shouldHighlight = searchTerm.length > 0 && (
    (keyName && keyName.toLowerCase().includes(searchTerm)) ||
    String(value).toLowerCase().includes(searchTerm)
  );

  return (
    <div className={cn(
      "flex items-center gap-2 group",
      !isRoot && "ml-4",
      shouldHighlight && "bg-yellow-100 rounded px-1"
    )}>
      {keyName && <span className="font-medium text-gray-700">{keyName}:</span>}
      <span className={cn("font-mono break-words", colorClass)}>{displayValue}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        onClick={() => copyToClipboard(String(value), keyName)}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Helper function to get color classes for different value types
function getValueColor(value: any): string {
  if (typeof value === "boolean") {
    return value ? "text-green-600" : "text-red-600";
  }
  if (typeof value === "number") {
    return "text-blue-600";
  }
  if (typeof value === "string") {
    return "text-green-700";
  }
  return "text-gray-600";
}

// Helper function to check if a node matches the search term
function matchesSearch(value: any, path: string, searchTerm: string): boolean {
  if (searchTerm.length === 0) return false;
  
  // Check if path matches
  if (path.toLowerCase().includes(searchTerm)) return true;
  
  // Check if value matches (for primitives)
  if (typeof value !== 'object' || value === null) {
    return String(value).toLowerCase().includes(searchTerm);
  }
  
  // For objects/arrays, recursively check children
  if (Array.isArray(value)) {
    return value.some((item, index) => 
      matchesSearch(item, `${path}[${index}]`, searchTerm)
    );
  }
  
  return Object.entries(value).some(([key, val]) =>
    key.toLowerCase().includes(searchTerm) ||
    matchesSearch(val, path ? `${path}.${key}` : key, searchTerm)
  );
}

// FormattedView component with syntax highlighting
function FormattedView({ response }: { response: any }) {
  const jsonString = JSON.stringify(response, null, 2);
  
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(jsonString, 'JSON')}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
      <SyntaxHighlighter
        language="json"
        style={vs}
        showLineNumbers
        lineNumberStyle={{ color: '#666', paddingRight: '1em', fontSize: '0.8em' }}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#fafafa',
          fontSize: '0.875rem',
        }}
        wrapLongLines
      >
        {jsonString}
      </SyntaxHighlighter>
    </div>
  );
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
          onClick={() => copyToClipboard(jsonString, 'JSON')}
          className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>
      <SyntaxHighlighter
        language="json"
        style={vscDarkPlus}
        showLineNumbers
        lineNumberStyle={{ color: '#666', paddingRight: '1em', fontSize: '0.8em' }}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#1e1e1e',
          fontSize: '0.875rem',
        }}
        wrapLongLines
      >
        {jsonString}
      </SyntaxHighlighter>
    </div>
  );
}
