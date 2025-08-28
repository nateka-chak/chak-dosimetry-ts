import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes with conditional class names.
 * Example:
 *   cn("px-2", isActive && "bg-blue-500")
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}
