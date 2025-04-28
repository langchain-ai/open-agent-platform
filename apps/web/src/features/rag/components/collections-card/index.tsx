"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderPlus } from "lucide-react";
import { useRagContext } from "../../providers/RAG";
import type { Collection } from "@/types/collection";
import { useState } from "react";
import { CollectionsList } from "../collections-list";
import { DEFAULT_COLLECTION_NAME } from "../../hooks/use-rag";
import { toast } from "sonner";

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
  const { createCollection, deleteCollection, listDocuments, setDocuments } =
    useRagContext();

  const [open, setOpen] = useState(false);

  // State for new collection name and description (used for the input fields)
  const [newCollectionName, setNewCollectionName] = useState("");

  // State for pagination
  const [collectionsCurrentPage, setCollectionsCurrentPage] = useState(1);
  const collectionsItemsPerPage = 5;

  // Handle creating a new collection (uses hook)
  const handleCreateCollection = async () => {
    if (newCollectionName === DEFAULT_COLLECTION_NAME) {
      toast.warning(`Default collection name is reserved.`, {
        description: "Please choose a different name.",
        duration: 5000,
      });
      return;
    }
    const success = await createCollection(newCollectionName);
    if (success) {
      setNewCollectionName(""); // Clear input fields on success
      setOpen(false);
    } else {
      toast.warning(
        `Collection named '${newCollectionName}' could not be created (likely already exists).`,
        {
          duration: 5000,
        },
      );
    }
  };

  // Handle deleting a collection (uses collection hook and document hook)
  const handleDeleteCollection = async (name: string) => {
    await deleteCollection(name);
    if (selectedCollection?.name === name) {
      setSelectedCollection(collections.find((c) => c.name !== name));
      setCurrentPage(1); // Reset document page
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Collections</CardTitle>
        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Enter a name for your new collection.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="collection-name"
                  className="text-right"
                >
                  Name
                </Label>
                <Input
                  id="collection-name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <CollectionsList
          collections={collections}
          selectedCollection={selectedCollection}
          onSelect={async (name) => {
            if (selectedCollection?.name === name) {
              return;
            }
            setSelectedCollection(collections.find((c) => c.name === name));
            setCurrentPage(1); // Reset page when collection changes
            setCollectionsCurrentPage(1);
            const documents = await listDocuments(name);
            setDocuments(documents);
          }}
          onDelete={(name) => handleDeleteCollection(name)}
          currentPage={collectionsCurrentPage}
          itemsPerPage={collectionsItemsPerPage}
          totalCollections={collections.length}
          onPageChange={setCollectionsCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
