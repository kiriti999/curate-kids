/**
 * Age range group mapping configuration
 * 
 * Maps Telegram group chat IDs to age ranges
 * Loaded from environment variables at startup
 */

import { AgeRange } from '../types/MessageState';

export interface AgeRangeGroupMapping {
  [chatId: number]: AgeRange;
}

// Load group chat IDs from environment variables
export const ageRangeGroups: AgeRangeGroupMapping = {
  [parseInt(process.env.GROUP_0_2 || '0')]: '0-2',
  [parseInt(process.env.GROUP_3_5 || '0')]: '3-5',
  [parseInt(process.env.GROUP_6_8 || '0')]: '6-8',
  [parseInt(process.env.GROUP_9_12 || '0')]: '9-12',
  [parseInt(process.env.GROUP_13_PLUS || '0')]: '13+',
};

/**
 * Get age range for a given chat ID
 * @param chatId - Telegram chat ID
 * @returns Age range, defaults to '0-2' if chat ID not found
 */
export function getAgeRange(chatId: number): AgeRange {
  const ageRange = ageRangeGroups[chatId];
  
  if (!ageRange) {
    console.warn(`[WARN] Chat ID ${chatId} not found in age range mapping, using default '0-2'`);
    return '0-2';
  }
  
  return ageRange;
}
