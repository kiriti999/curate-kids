/**
 * Playlist handler - "Add to playlist" flow shown after a video is saved
 *
 * Callback data (Telegram limits it to 64 bytes; ObjectIds are 24 chars):
 *   pl:<videoId>             show recent playlists
 *   pla:<videoId>:<listId>   add video to an existing playlist
 *   pln:<videoId>            ask for a name, then create a playlist
 */

import { InlineKeyboard } from "grammy";
import type { Context } from "grammy";
import * as logger from "../utils/logger.ts";
import { findUserByTelegramId } from "../services/organization.ts";
import {
  addVideoToPlaylist,
  createPlaylistWithVideo,
  listRecentPlaylists,
} from "../services/playlist.ts";
import { setPendingPlaylist, takePendingPlaylist } from "../types/pendingPlaylist.ts";
import { PARSE_MODE_MARKDOWN } from "./constants.ts";

const PROMPT_LINK_ACCOUNT = "🔗 Link your account with /link to use playlists";
const PROMPT_NAME_PLAYLIST = "📝 Reply with a name for your new playlist:";
const OBJECT_ID = /^[a-f0-9]{24}$/;

/** Keyboard with a single "Add to playlist" button for a saved video */
export function buildAddToPlaylistKeyboard(videoId: string): InlineKeyboard {
  return new InlineKeyboard().text("➕ Add to playlist", `pl:${videoId}`);
}

export function isPlaylistCallback(data: string): boolean {
  return data.startsWith("pl:") || data.startsWith("pla:") || data.startsWith("pln:");
}

export async function handlePlaylistCallback(ctx: Context, data: string): Promise<void> {
  const [action, videoId, playlistId] = data.split(":");
  if (!videoId || !OBJECT_ID.test(videoId)) {
    await ctx.answerCallbackQuery("❌ Invalid selection");
    return;
  }

  const user = ctx.from ? await findUserByTelegramId(String(ctx.from.id)) : null;
  if (!user) {
    await ctx.answerCallbackQuery({ text: PROMPT_LINK_ACCOUNT, show_alert: true });
    return;
  }

  if (action === "pl") return await showPlaylists(ctx, user.id, videoId);
  if (action === "pln") return await askForName(ctx, videoId);
  if (action === "pla" && playlistId && OBJECT_ID.test(playlistId)) {
    return await addToExisting(ctx, user.id, videoId, playlistId);
  }
  await ctx.answerCallbackQuery("❌ Invalid selection");
}

async function showPlaylists(ctx: Context, userId: string, videoId: string): Promise<void> {
  const playlists = await listRecentPlaylists(userId);
  const keyboard = new InlineKeyboard();
  for (const p of playlists) {
    keyboard.text(`🎞️ ${p.title.slice(0, 40)}`, `pla:${videoId}:${p.id}`).row();
  }
  keyboard.text("🆕 New playlist", `pln:${videoId}`);

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
}

async function askForName(ctx: Context, videoId: string): Promise<void> {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  if (!chatId || !userId) return;

  await setPendingPlaylist(chatId, userId, videoId);
  await ctx.answerCallbackQuery();
  await ctx.reply(PROMPT_NAME_PLAYLIST, {
    reply_markup: { force_reply: true, selective: true, input_field_placeholder: "Playlist name" },
  });
}

async function addToExisting(
  ctx: Context,
  userId: string,
  videoId: string,
  playlistId: string,
): Promise<void> {
  const result = await addVideoToPlaylist({ ownerId: userId, playlistId, videoId });

  if (result.status === "failed") {
    await ctx.answerCallbackQuery("❌ Couldn't add to playlist");
    return;
  }

  const text =
    result.status === "added"
      ? `✅ Added to "${result.title}"`
      : `ℹ️ Already in "${result.title}"`;
  await ctx.answerCallbackQuery(text);
  // Drop the buttons so the message doesn't invite a second tap
  await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => {});
  logger.info("Video added to playlist", { videoId, playlistId, status: result.status });
}

/**
 * Consume a reply to the "name your playlist" prompt.
 * @returns true if the message was handled as a playlist name
 */
export async function handlePlaylistNameReply(ctx: Context, text: string): Promise<boolean> {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  if (!chatId || !userId) return false;

  const videoId = await takePendingPlaylist(chatId, userId);
  if (!videoId) return false;

  const user = await findUserByTelegramId(String(userId));
  if (!user) {
    await ctx.reply(PROMPT_LINK_ACCOUNT);
    return true;
  }

  const playlistId = await createPlaylistWithVideo({
    ownerId: user.id,
    organizationId: user.organization,
    title: text,
    videoId,
  });

  await ctx.reply(
    playlistId
      ? `✅ Created playlist *${text.trim().slice(0, 120).replace(/[*_`\[]/g, "")}* with this video`
      : "❌ Couldn't create the playlist. Please try again.",
    { parse_mode: PARSE_MODE_MARKDOWN },
  );
  return true;
}
