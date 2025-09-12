import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collection } from "@/types/collection";
import { Edit, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export function EditCollectionDialog({
  collection,
  handleEditCollection,
}: {
  collection: Collection;
  handleEditCollection: (
    id: string,
    name: string,
    metadata: Record<string, any>,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(
    collection.metadata.description || "",
  );

  const DESCRIPTION_MAX_LENGTH = 850;
  const isDescriptionTooLong = description.length > DESCRIPTION_MAX_LENGTH;

  const hasChanges =
    name !== collection.name || description !== collection.metadata.description;

  const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!hasChanges) {
      setOpen(false);
      return;
    }
    await handleEditCollection(collection.uuid, name, {
      description,
    });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-2 py-1.5 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>
            Edit the name and description for your collection.
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label
              htmlFor="collection-description"
              className="text-right"
            >
              Description
            </Label>
            <div className="col-span-3 space-y-2">
              <Textarea
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="text-muted-foreground text-right text-xs">
                {description.length}/{DESCRIPTION_MAX_LENGTH} characters
              </div>
            </div>
          </div>
          {isDescriptionTooLong && (
            <div className="mt-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Description exceeds the maximum length of{" "}
                  {DESCRIPTION_MAX_LENGTH} characters.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || isDescriptionTooLong}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
