"use client";

import React, { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Document } from "../utils";

interface CitationsProps {
  urls: string[];
  sourceToDocumentsMap: Record<string, Document>;
}

export const Citations = React.memo<CitationsProps>(
  ({ urls, sourceToDocumentsMap }) => {
    if (urls.length === 0) return null;

    return (
      <div className="mt-3 space-y-1.5">
        <div className="text-muted-foreground text-xs font-medium">
          Sources ({urls.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {urls.map((url, index) => (
            <Citation
              key={`${url}-${index}`}
              url={url}
              document={sourceToDocumentsMap[url]}
            />
          ))}
        </div>
      </div>
    );
  },
);

Citations.displayName = "Citations";

const CHARACTER_LIMIT = 40;

interface CitationProps {
  url: string;
  document: Document | null;
}
export const Citation = React.memo<CitationProps>(({ url, document }) => {
  const displayUrl =
    url.length > CHARACTER_LIMIT
      ? url.substring(0, CHARACTER_LIMIT) + "..."
      : url;

  const favicon = useMemo(() => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return undefined;
    }
  }, [url]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 transition-colors hover:border-gray-300 hover:bg-gray-50"
      title={url}
    >
      <>
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="h-3 w-3 flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : (
          <ExternalLink className="h-3 w-3 flex-shrink-0 text-gray-400" />
        )}
        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
          {document?.title || displayUrl}
        </span>
      </>
    </a>
  );
});

Citation.displayName = "Citation";
