import { useState, Dispatch, SetStateAction, useCallback } from "react";
import { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";
import { Collection, CollectionCreate } from "@/types/collection";

export const DEFAULT_COLLECTION_NAME = "default_collection";

export function getDefaultCollection(collections: Collection[]): Collection {
  return (
    collections.find((c) => c.name === DEFAULT_COLLECTION_NAME) ??
    collections[0]
  );
}

function getApiUrlOrThrow() {
  if (!process.env.NEXT_PUBLIC_RAG_API_URL) {
    throw new Error(
      "Failed to upload documents: API URL not configured. Please set NEXT_PUBLIC_RAG_API_URL",
    );
  }
  return process.env.NEXT_PUBLIC_RAG_API_URL;
}

export function getCollectionName(name: string | undefined) {
  if (!name) return "";
  return name === DEFAULT_COLLECTION_NAME ? "Default" : name;
}

/**
 * Uploads documents to a specific collection using the API.
 *
 * @param collectionName The name of the collection to add documents to.
 * @param files An array of File objects to upload.
 * @param metadatas Optional array of metadata objects, one for each file.
 *                  Each item in the array should be a serializable object (dictionary).
 * @param apiUrlBase The base URL of your LangConnect API (e.g., "http://localhost:8000").
 * @returns A promise that resolves with the API response.
 */
async function uploadDocuments(
  collectionName: string,
  files: File[],
  metadatas?: Record<string, any>[],
): Promise<any> {
  const API_BASE_URL = getApiUrlOrThrow();
  if (!API_BASE_URL) {
    throw new Error("Failed to upload documents: API URL not configured.");
  }
  const url = `${API_BASE_URL}/collections/${encodeURIComponent(collectionName)}/documents`;

  const formData = new FormData();

  // Append files
  files.forEach((file) => {
    formData.append("files", file, file.name);
  });

  // Append metadatas if provided
  if (metadatas) {
    if (metadatas.length !== files.length) {
      throw new Error(
        `Number of metadata objects (${metadatas.length}) must match the number of files (${files.length}).`,
      );
    }
    // FastAPI expects the metadatas as a JSON *string* in the form data
    const metadatasJsonString = JSON.stringify(metadatas);
    formData.append("metadatas_json", metadatasJsonString);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // Attempt to parse error details from the response body
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson);
      } catch (_) {
        // If parsing JSON fails, use the status text
        errorDetail = `${errorDetail} - ${response.statusText}`;
      }
      throw new Error(`Failed to upload documents: ${errorDetail}`);
    }

    return await response.json(); // Parse the successful JSON response
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error; // Re-throw the error for further handling
  }
}

// --- Type Definitions ---

// Return type for the combined hook
interface UseRagReturn {
  // Initial load
  initialFetch: () => Promise<void>;

  // Collection state and operations
  collections: Collection[];
  setCollections: Dispatch<SetStateAction<Collection[]>>;
  collectionsLoading: boolean;
  setCollectionsLoading: Dispatch<SetStateAction<boolean>>;
  getCollections: () => Promise<Collection[]>;
  createCollection: (name: string) => Promise<Collection | undefined>;
  deleteCollection: (name: string) => Promise<string | undefined>;

  // Selected collection
  selectedCollection: Collection | undefined;
  setSelectedCollection: Dispatch<SetStateAction<Collection | undefined>>;

  // Document state and operations
  documents: Document[];
  setDocuments: Dispatch<SetStateAction<Document[]>>;
  documentsLoading: boolean;
  setDocumentsLoading: Dispatch<SetStateAction<boolean>>;
  listDocuments: (
    collectionId: string,
    args?: { limit?: number; offset?: number },
  ) => Promise<Document[]>;
  deleteDocument: (id: string) => Promise<void>;
  handleFileUpload: (
    files: FileList | null,
    collectionName: string,
  ) => Promise<void>;
  handleTextUpload: (
    textInput: string,
    collectionName: string,
  ) => Promise<void>;
}

/**
 * Custom hook for managing RAG collections and documents.
 * Combines the logic of useCollections and useDocuments.
 */
export function useRag(): UseRagReturn {
  // --- State ---
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<
    Collection | undefined
  >(undefined);

  // --- Initial Fetch ---
  const initialFetch = useCallback(async () => {
    setCollectionsLoading(true);
    setDocumentsLoading(true);
    let defaultCollectionId = "";
    const initCollections = await getCollections();
    if (!initCollections.length) {
      // No collections exist, create the default collection.
      const defaultCollection = await createCollection(DEFAULT_COLLECTION_NAME);
      if (!defaultCollection) {
        throw new Error("Failed to create default collection");
      }
      defaultCollectionId = defaultCollection.uuid;
    } else {
      setCollections(initCollections);
      defaultCollectionId =
        initCollections.find((c) => c.name === DEFAULT_COLLECTION_NAME)?.uuid ||
        "";
    }
    setCollectionsLoading(false);
    setSelectedCollection(
      initCollections.find((c) => c.uuid === defaultCollectionId),
    );

    const documents = await listDocuments(DEFAULT_COLLECTION_NAME, {
      limit: 100,
    });
    setDocuments(documents);
    setDocumentsLoading(false);
  }, []);

  // --- Document Operations ---

  const listDocuments = useCallback(
    async (
      collectionName: string,
      args?: { limit?: number; offset?: number },
    ): Promise<Document[]> => {
      const url = new URL(getApiUrlOrThrow());
      url.pathname = `/collections/${collectionName}/documents`;
      if (args?.limit) {
        url.searchParams.set("limit", args.limit.toString());
      }
      if (args?.offset) {
        url.searchParams.set("offset", args.offset.toString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    },
    [],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!selectedCollection) {
        throw new Error("No collection selected");
      }

      const url = new URL(getApiUrlOrThrow());
      url.pathname = `/collections/${selectedCollection.name}/documents/${id}`;

      const response = await fetch(url.toString(), { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }

      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.metadata?.id !== id),
      );
    },
    [selectedCollection],
  );

  const handleFileUpload = useCallback(
    async (files: FileList | null, collectionName: string) => {
      if (!files || files.length === 0) {
        console.warn("File upload skipped: No files selected.");
        return;
      }

      const newDocs: Document[] = Array.from(files).map((file) => {
        return new Document({
          id: uuidv4(),
          pageContent: `Content of ${file.name}`, // Placeholder: Real implementation needs file reading
          metadata: {
            name: file.name,
            collection: collectionName,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            created_at: new Date().toISOString(),
          },
        });
      });

      await uploadDocuments(
        collectionName,
        Array.from(files),
        newDocs.map((d) => d.metadata),
      );
      setDocuments((prevDocs) => [...prevDocs, ...newDocs]);
    },
    [],
  );

  const handleTextUpload = useCallback(
    async (textInput: string, collectionName: string) => {
      if (!textInput.trim() || collectionName === "all") {
        console.warn(
          "Text upload skipped: Text is empty or collection is 'all'.",
        );
        return;
      }
      const textBlob = new Blob([textInput], { type: "text/plain" });
      const fileName = `Text Document ${new Date().toISOString().slice(0, 19).replace("T", " ")}.txt`;
      const textFile = new File([textBlob], fileName, { type: "text/plain" });
      const metadata = {
        name: fileName,
        collection: collectionName,
        size: `${(textInput.length / 1024).toFixed(1)} KB`,
        created_at: new Date().toISOString(),
      };
      await uploadDocuments(collectionName, [textFile], [metadata]);
      setDocuments((prevDocs) => [
        ...prevDocs,
        new Document({
          id: uuidv4(),
          pageContent: textInput,
          metadata,
        }),
      ]);
    },
    [],
  );

  // --- Collection Operations ---

  const getCollections = useCallback(async (): Promise<Collection[]> => {
    const url = new URL(getApiUrlOrThrow());
    url.pathname = "/collections";

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  }, []);

  const createCollection = useCallback(
    async (name: string): Promise<Collection | undefined> => {
      const url = new URL(getApiUrlOrThrow());
      url.pathname = "/collections";

      const trimmedName = name.trim();
      if (!trimmedName) {
        console.error("Collection name cannot be empty.");
        return undefined;
      }
      const nameExists = collections.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (nameExists) {
        console.warn(`Collection with name "${trimmedName}" already exists.`);
        return undefined;
      }

      const newCollection: CollectionCreate = {
        name: trimmedName,
      };
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCollection),
      });
      if (!response.ok) {
        console.error(`Failed to create collection: ${response.statusText}`);
        return undefined;
      }
      const data = await response.json();
      setCollections((prevCollections) => [...prevCollections, data]);
      return data;
    },
    [collections],
  );

  const deleteCollection = useCallback(
    async (name: string): Promise<string | undefined> => {
      const collectionToDelete = collections.find((c) => c.name === name);
      const deletedCollectionName = collectionToDelete?.name;

      if (!deletedCollectionName) {
        return;
      }

      const url = new URL(getApiUrlOrThrow());
      url.pathname = `/collections/${name}`;

      const response = await fetch(url.toString(), {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error(`Failed to delete collection: ${response.statusText}`);
        return undefined;
      }

      // Delete the collection itself
      setCollections((prevCollections) =>
        prevCollections.filter((collection) => collection.name !== name),
      );
    },
    [collections],
  );

  // --- Return combined state and functions ---
  return {
    // Initial load
    initialFetch,

    // Collections
    collections,
    setCollections,
    collectionsLoading,
    setCollectionsLoading,
    getCollections,
    createCollection,
    deleteCollection,

    selectedCollection,
    setSelectedCollection,

    // Documents
    documents,
    setDocuments,
    documentsLoading,
    setDocumentsLoading,
    listDocuments,
    deleteDocument,
    handleFileUpload,
    handleTextUpload,
  };
}
