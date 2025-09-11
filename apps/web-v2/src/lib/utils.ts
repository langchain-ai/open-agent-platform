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
