import * as React from "react";

/**
 * Custom hook to save and restore scroll position when navigating between views
 * @returns Object containing scroll position and methods to save/restore it
 */
export function useScrollPosition() {
  // Use ref to persist scroll position value between renders
  const scrollPositionRef = React.useRef<number>(0);

  // Track which element was scrolled
  const scrollElementRef = React.useRef<"window" | "element">("window");

  // Save the current scroll position
  const saveScrollPosition = React.useCallback(
    (element?: HTMLElement | null) => {
      if (typeof window === "undefined") return;

      // If element is provided, use its scrollTop, otherwise use window.scrollY
      if (element && element.scrollTop > 0) {
        scrollPositionRef.current = element.scrollTop;
        scrollElementRef.current = "element";
      } else {
        scrollPositionRef.current = window.scrollY;
        scrollElementRef.current = "window";
      }
    },
    [],
  );

  // Restore the saved scroll position
  const restoreScrollPosition = React.useCallback(
    (element?: HTMLElement | null) => {
      if (typeof window === "undefined") return;

      const position = scrollPositionRef.current;
      const elementType = scrollElementRef.current;

      if (position <= 0) {
        return;
      }

      // Use requestAnimationFrame to ensure DOM updates have completed
      window.requestAnimationFrame(() => {
        // Try the provided element first
        if (element && elementType === "element") {
          // Use scrollTo with smooth behavior if supported
          if ("scrollTo" in element) {
            element.scrollTo({
              top: position,
              behavior: "smooth",
            });
          } else {
            // Fallback for older browsers
            (element as HTMLElement).scrollTop = position;
          }
        } else {
          // Fall back to window scroll with smooth behavior
          window.scrollTo({
            top: position,
            behavior: "smooth",
          });
        }
      });
    },
    [],
  );

  return {
    scrollPosition: scrollPositionRef.current,
    saveScrollPosition,
    restoreScrollPosition,
  };
}
