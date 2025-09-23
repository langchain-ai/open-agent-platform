import { Copy, CopyCheck } from "lucide-react";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThreadIdCopyable({
  threadId,
  showUUID = false,
}: {
  threadId: string;
  showUUID?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(threadId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipIconButton
      onClick={(e) => handleCopy(e)}
      variant="ghost"
      tooltip="Copy thread ID"
      className="flex w-fit flex-grow-0 cursor-pointer items-center gap-1 rounded-md border-[1px] border-gray-200 p-1 hover:bg-gray-50/90"
    >
      <p className="font-mono text-xs">{showUUID ? threadId : "ID"}</p>
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {copied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <CopyCheck className="h-3 max-h-3 w-3 max-w-3 text-green-500" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Copy className="h-3 max-h-3 w-3 max-w-3 text-gray-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipIconButton>
  );
}
