/**
 * Age range configuration
 * 
 * @deprecated This file is no longer used for group-to-age-range mapping.
 * Age ranges are now selected per video by users via inline keyboards.
 * See src/handlers/constants.ts for the current AGE_RANGES configuration.
 */

/**
 * Legacy type kept for backward compatibility
 * Modern age ranges are defined in src/handlers/constants.ts
 */
export type AgeRange = "0-2" | "3-5" | "6-8" | "9-12" | "13+" |
  "1-2" | "2-3" | "3-4" | "4-5" | "5-8" |
  "12-15" | "16-18" | "18+";

/**
 * @deprecated No longer used. Age ranges are selected per video, not per group.
 */
export function getAgeRangeGroups(): Map<number, AgeRange> {
  return new Map<number, AgeRange>();
}

/**
 * @deprecated No longer used. Age ranges are selected per video, not per group.
 */
export function getAgeRange(chatId: number): AgeRange {
  // Return empty string or default - this function is deprecated
  return "" as AgeRange;
}
