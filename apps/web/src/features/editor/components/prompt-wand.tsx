"use client";

import React from "react";
import { Wand2, Loader2, X, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

type InstructionsApi = {
  getMarkdown: () => Promise<string>;
  setMarkdown: (markdown: string) => Promise<void>;
};

type PromptWandApi = {
  open: (prefill?: string, anchor?: { x: number; y: number }) => void;
  close: () => void;
};

interface PromptWandProps {
  instructionsApiRef: React.MutableRefObject<InstructionsApi | null>;
  className?: string;
  apiRef?: React.MutableRefObject<PromptWandApi | null>;
}

export function PromptWand({
  instructionsApiRef,
  className,
  apiRef,
}: PromptWandProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Target width for the compact bar (less wide)
  const targetWidth = 400; // px

  // Positioning: either docked near wand (bottom-right) or anchored near selection
  const [_anchor, setAnchor] = React.useState<{ x: number; y: number } | null>(
    null,
  );
  // Preview of selected text when opened via Cmd/Ctrl+K
  const [selectionPreview, setSelectionPreview] = React.useState<string | null>(
    null,
  );

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    const api = instructionsApiRef.current;
    if (!api) {
      toast.error("Instructions editor not ready");
      return;
    }
    try {
      setLoading(true);
      const current = await api.getMarkdown();
      const res = await fetch("/api/prompt/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: current, request: query }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Rewrite failed with ${res.status}`);
      }
      const data: { rewritten: string } = await res.json();
      await api.setMarkdown(data.rewritten || current);
      toast.success("Instructions updated");
      setQuery("");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to rewrite instructions",
      );
    } finally {
      setLoading(false);
    }
  };

  // Expose open/close to parent via ref
  React.useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      open: (prefill?: string, nextAnchor?: { x: number; y: number }) => {
        // Show the selected text above the bar; keep input empty for user prompt
        setSelectionPreview(prefill ?? null);
        setQuery("");
        // Keep the bar docked in the corner (ignore selection anchor for position)
        setAnchor(null);
        setOpen(true);
        // focus after a short tick to ensure input is mounted
        setTimeout(() => inputRef.current?.focus(), 50);
      },
      close: () => setOpen(false),
    };
    return () => {
      if (apiRef) apiRef.current = null;
    };
  }, [apiRef]);

  return (
    <>
      {/* Floating wand button */}
      <button
        type="button"
        aria-label="Rewrite"
        onClick={() => {
          setAnchor(null);
          setSelectionPreview(null);
          setOpen((v) => !v);
        }}
        className={cn(
          "fixed right-6 bottom-6 z-40 rounded-full bg-[#2F6868] p-3 text-white shadow-lg transition hover:bg-[#2F6868]/90",
          className,
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Wand2 className="h-5 w-5" />
        )}
      </button>

      {/* Selected text preview (shows above the docked bar when opened via Cmd/Ctrl+K) */}
      <AnimatePresence>
        {open && selectionPreview && (
          <motion.div
            key="wand-selection-preview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed right-20 bottom-20 z-40 max-w-[60vw] truncate rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 shadow"
            title={selectionPreview}
          >
            {selectionPreview.length > 100
              ? `${selectionPreview.slice(0, 100)}...`
              : selectionPreview}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated compact bar docked near bottom-right */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="wand-bar"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={cn(
              "fixed right-20 bottom-6 z-40 origin-right overflow-hidden rounded-full border border-gray-200 bg-white shadow-xl",
            )}
            style={{ width: targetWidth, transformOrigin: "right" }}
            onAnimationComplete={() => {
              // Focus input after opening animation completes
              if (open) inputRef.current?.focus();
            }}
          >
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 px-3 py-2"
            >
              <Wand2 className="h-4 w-4 shrink-0 text-gray-500" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rewrite (e.g., concise)"
                className="w-full border-0 shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !query.trim()}
                className="shrink-0 bg-[#2F6868] hover:bg-[#2F6868]/90"
                aria-label="Apply"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
