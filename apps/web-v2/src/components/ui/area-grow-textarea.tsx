// components/AutoGrowTextarea.tsx
"use client";

import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

type AutoGrowTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "rows" | "onChange"
> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /**
   * Minimum number of rows to display.
   * @default 2
   */
  minRows?: number;
  /**
   * Maximum number of rows to display.
   * @default 6
   */
  maxRows?: number;
  /**
   * If provided, caps height in px (overrides maxRows). Default: derived from maxRows
   */
  maxHeightPx?: number;
  /**
   * Whether or not to exclude the default styles
   * @default false
   */
  excludeDefaultStyles?: boolean;
};

export default function AutoGrowTextarea({
  value,
  onChange,
  minRows = 2,
  maxRows = 6,
  maxHeightPx,
  excludeDefaultStyles = false,
  className = "",
  ...rest
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Reset height to auto so scrollHeight is accurate for current content
    el.style.height = "auto";

    // Compute max height either from prop or from line-height * maxRows (+ vertical paddings)
    const cs = window.getComputedStyle(el);
    // line-height can be 'normal' — approximate via 1.2 * font-size in that case
    const fontSizePx = parseFloat(cs.fontSize || "16");
    const lineHeightPxRaw =
      cs.lineHeight === "normal" ? 1.2 * fontSizePx : parseFloat(cs.lineHeight);

    const paddingTop = parseFloat(cs.paddingTop || "0");
    const paddingBottom = parseFloat(cs.paddingBottom || "0");
    const verticalPadding = paddingTop + paddingBottom;

    const derivedMaxHeight = lineHeightPxRaw * maxRows + verticalPadding;
    const cap =
      typeof maxHeightPx === "number" ? maxHeightPx : derivedMaxHeight;

    // Set height to min(scrollHeight, cap)
    const target = Math.min(el.scrollHeight, cap);
    el.style.height = `${target}px`;

    // Toggle overflow when capped
    el.style.overflowY = el.scrollHeight > cap ? "auto" : "hidden";
  }, [maxRows, maxHeightPx]);

  // Resize on mount and whenever value changes
  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  // Also resize on font load / container size changes
  useEffect(() => {
    const r = ref.current;
    if (!r) return;

    // ResizeObserver helps if the element's width changes (wrapping -> height changes)
    const ro = new ResizeObserver(() => resize());
    ro.observe(r);

    // Fallback on window resize
    const onWin = () => resize();
    window.addEventListener("resize", onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [resize]);

  const defaultStyles = cn(
    // Base look
    "w-full rounded-xl border border-gray-300 bg-white p-3",
    "text-sm leading-6 text-gray-900 placeholder:text-gray-400",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    "shadow-sm",
  );

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={onChange}
      className={cn(
        !excludeDefaultStyles && defaultStyles,
        "resize-none overflow-hidden",
        className,
      )}
      {...rest}
    />
  );
}
