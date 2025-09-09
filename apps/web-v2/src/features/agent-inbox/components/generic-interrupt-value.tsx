import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ThreadIdCopyable } from "./thread-id";
import { logger } from "../utils/logger";

// Helper to check for complex types (Array or Object)
function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

// Helper to truncate long strings
const truncateString = (str: string, maxLength: number = 100): string => {
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
};

// Helper to render simple values or truncated complex values for the collapsed view
const renderCollapsedValue = (
  value: any,
  isComplex: boolean,
): React.ReactNode => {
  if (value === null) {
    return <span className="text-gray-500">null</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-blue-600">{String(value)}</span>;
  }
  if (typeof value === "number") {
    return <span className="text-green-600">{String(value)}</span>;
  }
  if (typeof value === "string") {
    // Apply truncation only to strings directly, not stringified complex types here
    return (
      <span className="text-purple-600">
        &quot;{truncateString(value)}&quot;
      </span>
    );
  }
  if (isComplex) {
    // Render truncated complex value for collapsed view
    try {
      // Show limited items/keys for preview
      let previewValue: any;
      if (Array.isArray(value)) {
        previewValue = value.slice(0, 3); // Show first 3 items
        if (value.length > 3) previewValue.push("...");
      } else {
        const keys = Object.keys(value);
        previewValue = {};
        keys.slice(0, 3).forEach((key) => {
          previewValue[key] = value[key]; // Show first 3 keys/values
        });
        if (keys.length > 3) previewValue["..."] = "...";
      }
      const strValue = JSON.stringify(previewValue, null, 2); // Pretty print preview
      return (
        <code className="block rounded bg-gray-50 px-2 py-1 font-mono text-sm whitespace-pre-wrap">
          {/* Truncate the stringified preview if it's still too long */}
          {truncateString(strValue, 200)}
        </code>
      );
    } catch (error) {
      logger.error("Error creating preview:", error);
      return <span className="text-red-500">Error creating preview</span>;
    }
  }
  // Fallback for other unexpected types
  return String(value);
};

// Helper to render the value within a table cell, stringifying complex types as needed
const renderTableCellValue = (value: any): React.ReactNode => {
  if (isComplexValue(value)) {
    try {
      // Stringify nested objects/arrays within the table
      return (
        <code className="block rounded bg-gray-50 px-2 py-1 font-mono text-sm whitespace-pre-wrap">
          {JSON.stringify(value, null, 2)}
        </code>
      );
    } catch (error) {
      logger.error("Error stringifying:", error);
      return <span className="text-red-500">Error stringifying</span>;
    }
  }
  // Use renderCollapsedValue logic for primitive types for consistent styling
  return renderCollapsedValue(value, false);
};

export function GenericInterruptValue({
  interrupt,
  id,
}: {
  interrupt: unknown;
  id: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const complex = isComplexValue(interrupt);

  // Determine if the expand button should be shown (only for complex types)
  let shouldShowExpandButton = false;
  if (complex) {
    try {
      const numEntries = Array.isArray(interrupt)
        ? interrupt.length
        : typeof interrupt === "object" && interrupt !== null
          ? Object.keys(interrupt).length
          : 0; // Default to 0 if not array or object
      // Show expand if more than 3 entries (as preview shows 3) or if it's non-empty
      shouldShowExpandButton = numEntries > 3;
      // Alternative: check string length if preferred
      // const contentStr = JSON.stringify(interrupt);
      // shouldShowExpandButton = contentStr.length > 200;
    } catch (error) {
      logger.error(
        "Error determining if expand button should be shown:",
        error,
      );
      shouldShowExpandButton = false; // Don't show button if error
    }
  }

  // Process entries for table view
  const processEntries = () => {
    if (Array.isArray(interrupt)) {
      return interrupt.map((item, index) => [index.toString(), item]);
    } else if (typeof interrupt === "object" && interrupt !== null) {
      return Object.entries(interrupt);
    }
    return [];
  };

  const displayEntries = complex ? processEntries() : [];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex flex-wrap items-center justify-center gap-2 font-medium text-gray-900">
            Interrupt{" "}
            <ThreadIdCopyable
              showUUID
              threadId={id}
            />
          </h3>
          {/* Simple Toggle Button in Header */}
          {complex && shouldShowExpandButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <motion.div
        className="bg-gray-100"
        initial={false}
        animate={{ height: "auto" }} // Let content dictate height
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <AnimatePresence
          mode="wait"
          initial={false}
        >
          {
            // Determine rendering mode
            (() => {
              const showTable =
                complex && (!shouldShowExpandButton || isExpanded);
              const showCollapsedPreview =
                complex && shouldShowExpandButton && !isExpanded;
              const showSimpleValue = !complex;

              return (
                <motion.div
                  key={showTable ? "table" : "preview"} // Key based on what's visible
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }} // Important for height animation
                >
                  {showSimpleValue && (
                    <div className="px-4 py-2 text-sm">
                      {renderCollapsedValue(interrupt, false)}
                    </div>
                  )}
                  {showCollapsedPreview && (
                    <div className="px-4 py-2 text-sm">
                      {renderCollapsedValue(interrupt, true)}{" "}
                      {/* Render the preview */}
                    </div>
                  )}
                  {showTable && (
                    // Render expanded table
                    <div
                      className="overflow-x-auto"
                      style={{
                        maxHeight:
                          "500px" /* Limit height for very long tables */,
                      }}
                    >
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="sticky top-0 z-10 bg-gray-50">
                          {/* Sticky header */}
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                              {Array.isArray(interrupt) ? "Index" : "Key"}
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {displayEntries.length === 0 && (
                            <tr>
                              <td
                                colSpan={2}
                                className="px-4 py-4 text-center text-sm text-gray-500"
                              >
                                {Array.isArray(interrupt)
                                  ? "Array is empty"
                                  : "Object is empty"}
                              </td>
                            </tr>
                          )}
                          {displayEntries.map(([key, value]) => (
                            <tr key={key}>
                              <td className="px-4 py-2 align-top text-sm font-medium whitespace-nowrap text-gray-900">
                                {key}
                              </td>
                              <td className="px-4 py-2 align-top text-sm text-gray-500">
                                {/* Render cell value using the helper */}
                                {renderTableCellValue(value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              );
            })()
          }
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
