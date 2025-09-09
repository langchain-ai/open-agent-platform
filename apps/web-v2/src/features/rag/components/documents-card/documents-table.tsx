"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, MoreVertical } from "lucide-react";
import { Document } from "@langchain/core/documents";
import { useRagContext } from "../../providers/RAG";
import { format } from "date-fns";
import { Collection } from "@/types/collection";
import { getCollectionName } from "../../hooks/use-rag";

interface DocumentsTableProps {
  documents: Document[];
  selectedCollection: Collection;
  actionsDisabled: boolean;
}

export function DocumentsTable({
  documents,
  selectedCollection,
  actionsDisabled,
}: DocumentsTableProps) {
  const { deleteDocument } = useRagContext();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document Name</TableHead>
          <TableHead>Collection</TableHead>
          <TableHead>Date Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-muted-foreground text-center"
            >
              No documents found in this collection.
            </TableCell>
          </TableRow>
        ) : (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.metadata.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {getCollectionName(selectedCollection.name)}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(doc.metadata.created_at), "MM/dd/yyyy h:mm a")}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={actionsDisabled}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the document
                        <span className="font-semibold">
                          {" "}
                          {doc.metadata.name}
                        </span>
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () =>
                          await deleteDocument(doc.metadata.file_id)
                        }
                        className="bg-destructive hover:bg-destructive/90 text-white"
                        disabled={actionsDisabled}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
