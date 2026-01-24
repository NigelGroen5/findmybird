/**
 * Shared utility functions
 */

/**
 * Converts a string to a number with a fallback value
 */
export function asNum(value: string | null, fallback: number): number {
  const num = value ? Number(value) : NaN;
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Example utility function
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
