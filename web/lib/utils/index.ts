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

/**
 * Parse a CSV line respecting quoted fields (e.g. "Ducks, Geese, and Waterfowl").
 * Doubled quotes "" inside quoted fields are decoded as a single ".
 */
export function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}
