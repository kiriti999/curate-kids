/**
 * Message state types - Using Deno KV for persistent storage
 */

import type { VideoPlatform } from "../utils/urlParser.ts";

// Age range type (now derived from organization)
export type AgeRange = "0-2" | "3-5" | "6-8" | "9-12" | "13+" | "";

export interface MessageState {
  messageId: number;
  chatId: number;
  userId: number;
  videoUrl: string;
  videoId: string;
  title: string;
  ageRange: AgeRange;
  createdAt: number;
  // Platform for URL-based videos
  platform?: VideoPlatform;
  // Telegram video upload fields (optional, only for direct uploads)
  source?: "url" | "telegram";
  cloudinaryUrl?: string;
  cloudinaryId?: string;
  thumbnailUrl?: string;
  duration?: number;

  // Organization/multi-tenant fields
  organizationId?: string;
  submittedByUserId?: string;
  submitterTelegramId?: string;
  submitterTelegramUsername?: string;
}

// Deno KV for persistent state (works on Deno Deploy)
const kv = await Deno.openKv();
const STATE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createStateKey(chatId: number, messageId: number): string {
  return `${chatId}:${messageId}`;
}

export async function setState(key: string, state: MessageState): Promise<void> {
  await kv.set(["video_state", key], state, { expireIn: STATE_TTL_MS });
}

export async function getState(key: string): Promise<MessageState | undefined> {
  const result = await kv.get<MessageState>(["video_state", key]);
  return result.value ?? undefined;
}

export async function deleteState(key: string): Promise<void> {
  await kv.delete(["video_state", key]);
}
