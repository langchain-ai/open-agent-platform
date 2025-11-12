import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @returns true if google auth is disabled
 */
export function googleAuthDisabled() {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_DISABLED === "true";
}

/**
 * Deep equality comparison for primitive values and arrays.
 * Used for comparing visible_if conditions with array values.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  // Reference equality check
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return a === b;

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }

  // For non-array objects, fall back to reference equality
  // (We only need array support for visible_if currently)
  return false;
}
