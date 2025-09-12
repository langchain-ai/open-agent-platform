"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRagContext } from "../providers/RAG";
import type { Collection } from "@/types/collection";
import { useState } from "react";
import { CollectionsList } from "./collections-list";
import { toast } from "sonner";
import { CreateCollectionDialog } from "./create-collection-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface CollectionsCardProps {
  collections: Collection[];
  selectedCollection: Collection | undefined;
  setSelectedCollection: React.Dispatch<
    React.SetStateAction<Collection | undefined>
  >;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export function CollectionsCard({
  collections,
  selectedCollection,
  setSelectedCollection,
  setCurrentPage,
}: CollectionsCardProps) {
  const {
    createCollection,
    deleteCollection,
    listDocuments,
    setDocuments,
    updateCollection,
  } = useRagContext();

  const [open, setOpen] = useState(false);

  // State for pagination
  const [collectionsCurrentPage, setCollectionsCurrentPage] = useState(1);
  const collectionsItemsPerPage = 5;

  // Handle creating a new collection (uses hook)
  const handleCreateCollection = async (name: string, description: string) => {
    const loadingToast = toast.loading("Creating collection", {
      richColors: true,
    });
    const success = await createCollection(name, {
      description,
    });
    toast.dismiss(loadingToast);
    if (success) {
      setOpen(false);
      toast.success("Collection created successfully", { richColors: true });
    } else {
      toast.warning(
        `Collection named '${name}' could not be created (likely already exists).`,
        {
          duration: 5000,
          richColors: true,
        },
      );
    }
  };

  // Handle deleting a collection (uses collection hook and document hook)
  const handleDeleteCollection = async (id: string) => {
    const loadingToast = toast.loading("Deleting collection", {
      richColors: true,
    });
    await deleteCollection(id);
    toast.dismiss(loadingToast);
    toast.success("Collection deleted successfully", { richColors: true });
    if (selectedCollection?.uuid === id) {
      const newSelectedCollection = collections.find((c) => c.uuid !== id);
      if (!newSelectedCollection) {
        toast.error("No collections remaining.", { richColors: true });
        return;
      }
      setSelectedCollection(newSelectedCollection);
      setCurrentPage(1); // Reset document page
      const docs = await listDocuments(newSelectedCollection.uuid);
      setDocuments(docs);
    }
  };

  const handleUpdateCollection = async (
    id: string,
    name: string,
    metadata: Record<string, any>,
  ) => {
    const loadingToast = toast.loading("Updating collection", {
      richColors: true,
    });
    await updateCollection(id, name, metadata);
    toast.dismiss(loadingToast);
    toast.success("Collection updated successfully", { richColors: true });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Collections</CardTitle>
        <CreateCollectionDialog
          open={open}
          onOpenChange={setOpen}
          onSubmit={handleCreateCollection}
        />
      </CardHeader>
      <CardContent>
        <CollectionsList
          collections={collections}
          selectedCollection={selectedCollection}
          onSelect={async (id) => {
            if (selectedCollection?.uuid === id) {
              return;
            }
            setSelectedCollection(collections.find((c) => c.uuid === id));
            setCurrentPage(1); // Reset page when collection changes
            setCollectionsCurrentPage(1);
            const documents = await listDocuments(id);
            setDocuments(documents);
          }}
          onDelete={(id) => handleDeleteCollection(id)}
          onEdit={handleUpdateCollection}
          currentPage={collectionsCurrentPage}
          itemsPerPage={collectionsItemsPerPage}
          totalCollections={collections.length}
          onPageChange={setCollectionsCurrentPage}
        />
      </CardContent>
    </Card>
  );
}

export function CollectionsCardLoading() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="size-8" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-8 w-full"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
