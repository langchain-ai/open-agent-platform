"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Collection } from "@/types/collection";
import {
  DEFAULT_COLLECTION_NAME,
  getCollectionName,
} from "../../hooks/use-rag";
import { cn } from "@/lib/utils";
import { CollectionActions } from "./collection-actions";

interface CollectionsListProps {
  collections: Collection[];
  selectedCollection: Collection | undefined;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (
    id: string,
    name: string,
    metadata: Record<string, any>,
  ) => Promise<void>;
  currentPage: number;
  itemsPerPage: number;
  totalCollections: number;
  onPageChange: (page: number) => void;
}

export function CollectionsList({
  collections,
  selectedCollection,
  onSelect,
  onDelete,
  onEdit,
  currentPage,
  itemsPerPage,
  totalCollections,
  onPageChange,
}: CollectionsListProps) {
  const totalPages = Math.ceil(totalCollections / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCollections = collections.slice(startIndex, endIndex);

  return (
    <div>
      <div className="space-y-2">
        {paginatedCollections.map((collection) => (
          <div
            key={collection.uuid}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-md p-2",
              selectedCollection?.uuid === collection.uuid
                ? "bg-muted"
                : "hover:bg-muted/50",
            )}
            onClick={() => onSelect(collection.uuid)}
          >
            <span>{getCollectionName(collection.name)}</span>
            {collection.name !== DEFAULT_COLLECTION_NAME && (
              <CollectionActions
                collection={collection}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.max(1, currentPage - 1));
                }}
                aria-disabled={currentPage === 1}
                className={cn(
                  currentPage === 1
                    ? "text-muted-foreground pointer-events-none"
                    : undefined,
                )}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, page) => (
              <PaginationItem key={page + 1}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page + 1);
                  }}
                  isActive={currentPage === page + 1}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Math.min(totalPages, currentPage + 1));
                }}
                aria-disabled={currentPage === totalPages}
                className={cn(
                  currentPage === totalPages
                    ? "text-muted-foreground pointer-events-none"
                    : undefined,
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
