"use client";

import type React from "react";
import { useState } from "react";
import {
  DocumentsCard,
  DocumentsCardLoading,
} from "./components/documents-card";
import {
  CollectionsCard,
  CollectionsCardLoading,
} from "./components/collections-card";
import { useRagContext } from "./providers/RAG";
import EmptyCollectionsState from "./components/empty-collections";
import { isRagAvailable } from "./hooks/use-rag";

export default function RAGInterface() {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    selectedCollection,
    setSelectedCollection,
    collections,
    initialSearchExecuted,
  } = useRagContext();

  if (!isRagAvailable()) {
    return null;
  }

  if (initialSearchExecuted && !collections.length) {
    return <EmptyCollectionsState />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Collections Section */}
        <div className="md:col-span-1">
          {initialSearchExecuted ? (
            <CollectionsCard
              collections={collections}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              setCurrentPage={setCurrentPage}
            />
          ) : (
            <CollectionsCardLoading />
          )}
        </div>

        {/* Documents Section */}
        <div className="md:col-span-2">
          {initialSearchExecuted ? (
            <DocumentsCard
              selectedCollection={selectedCollection}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          ) : (
            <DocumentsCardLoading />
          )}
        </div>
      </div>
    </div>
  );
}
