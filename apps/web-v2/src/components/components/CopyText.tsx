"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { motion } from "framer-motion";

interface CopyTextProps {
  currentArtifactContent: string;
}

export function CopyText({ currentArtifactContent }: CopyTextProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!currentArtifactContent || isCopied) return;

    try {
      await navigator.clipboard.writeText(currentArtifactContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipIconButton
        tooltip={isCopied ? "Copied!" : "Copy text"}
        variant="outline"
        delayDuration={400}
        onClick={handleCopy}
      >
        {isCopied ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <Copy className="h-5 w-5 text-gray-600" />
        )}
      </TooltipIconButton>
    </motion.div>
  );
}
