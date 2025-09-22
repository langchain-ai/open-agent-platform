"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Simple types for the editor functionality
export interface ArtifactContent {
  index: number;
  fullMarkdown: string;
  title: string;
  type: "text";
}

export interface Artifact {
  currentIndex: number;
  contents: ArtifactContent[];
}

export interface SelectedBlocks {
  fullMarkdown: string;
  markdownBlock: string;
  selectedText: string;
}

export interface GraphData {
  artifact?: Artifact;
  isStreaming: boolean;
  updateRenderedArtifactRequired: boolean;
  firstTokenReceived: boolean;
  selectedBlocks?: SelectedBlocks;
  setArtifact: (artifact: Artifact | ((prev?: Artifact) => Artifact)) => void;
  setSelectedBlocks: (blocks?: SelectedBlocks) => void;
  setUpdateRenderedArtifactRequired: (required: boolean) => void;
}

const GraphContext = createContext<{ graphData: GraphData } | undefined>(undefined);

export function GraphProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<Artifact | undefined>();
  const [selectedBlocks, setSelectedBlocks] = useState<SelectedBlocks | undefined>();
  const [isStreaming] = useState(false);
  const [updateRenderedArtifactRequired, setUpdateRenderedArtifactRequired] = useState(false);
  const [firstTokenReceived] = useState(true);

  const graphData: GraphData = {
    artifact,
    isStreaming,
    updateRenderedArtifactRequired,
    firstTokenReceived,
    selectedBlocks,
    setArtifact,
    setSelectedBlocks,
    setUpdateRenderedArtifactRequired,
  };

  return (
    <GraphContext.Provider value={{ graphData }}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraphContext() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraphContext must be used within a GraphProvider");
  }
  return context;
}