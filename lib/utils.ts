import { twMerge } from "tailwind-merge";

// Merges Tailwind classes, stripping falsy values to avoid conflicts.
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(...(inputs.filter(Boolean) as string[]));
}
