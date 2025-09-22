import { useEffect, useState } from "react";
import { CopyText } from "./components/CopyText";
import { useGraphContext } from "@/contexts/GraphContext";
import React from "react";
import { Textarea } from "@/components/ui/textarea";

const cleanText = (text: string) => {
  return text.replaceAll("\\\n", "\n");
};

// Helper function to get artifact content
const getArtifactContent = (artifact: any): string => {
  if (!artifact) return "";
  const currentContent = artifact.contents.find(
    (c: any) => c.index === artifact.currentIndex
  );
  return currentContent?.fullMarkdown || "";
};

export interface TextRendererProps {
  isEditing: boolean;
  isHovering: boolean;
  isInputVisible: boolean;
}

export function TextRendererComponent(props: TextRendererProps) {
  const { graphData } = useGraphContext();
  const {
    artifact,
    setArtifact,
    setSelectedBlocks,
  } = graphData;

  const [markdown, setMarkdown] = useState("");

  // Initialize with default content if no artifact exists
  useEffect(() => {
    if (!artifact) {
      const defaultMarkdown = "# Welcome to the Editor\n\nStart typing your markdown here...";
      setMarkdown(defaultMarkdown);
      setArtifact({
        currentIndex: 1,
        contents: [
          {
            index: 1,
            fullMarkdown: defaultMarkdown,
            title: "Untitled",
            type: "text",
          },
        ],
      });
    } else {
      const currentContent = artifact.contents.find(
        (c) => c.index === artifact.currentIndex
      );
      if (currentContent) {
        setMarkdown(currentContent.fullMarkdown);
      }
    }
  }, [artifact, setArtifact]);

  useEffect(() => {
    if (!props.isInputVisible) {
      setSelectedBlocks(undefined);
    }
  }, [props.isInputVisible, setSelectedBlocks]);

  const onChangeMarkdown = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdown(newMarkdown);
    setArtifact((prev) => {
      if (!prev) {
        return {
          currentIndex: 1,
          contents: [
            {
              index: 1,
              fullMarkdown: newMarkdown,
              title: "Untitled",
              type: "text",
            },
          ],
        };
      } else {
        return {
          ...prev,
          contents: prev.contents.map((c) => {
            if (c.index === prev.currentIndex) {
              return {
                ...c,
                fullMarkdown: newMarkdown,
              };
            }
            return c;
          }),
        };
      }
    });
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {props.isHovering && artifact && (
        <div className="absolute flex gap-2 top-2 right-4 z-10">
          <CopyText currentArtifactContent={getArtifactContent(artifact)} />
        </div>
      )}
      <Textarea
        className="whitespace-pre-wrap font-mono text-sm p-6 border-0 shadow-none h-full outline-none ring-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
        value={markdown}
        onChange={onChangeMarkdown}
        placeholder="# Enter your markdown here..."
      />
    </div>
  );
}

export const TextRenderer = React.memo(TextRendererComponent);