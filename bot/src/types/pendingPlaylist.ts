/**
 * Pending "name your playlist" state - Deno KV, short-lived.
 * Set when a user taps "New playlist"; consumed by their next reply.
 */

const kv = await Deno.openKv();
const TTL_MS = 10 * 60 * 1000;

export async function setPendingPlaylist(
  chatId: number,
  userId: number,
  videoId: string,
): Promise<void> {
  await kv.set(["playlist_pending", chatId, userId], videoId, { expireIn: TTL_MS });
}

export async function takePendingPlaylist(
  chatId: number,
  userId: number,
): Promise<string | undefined> {
  const key = ["playlist_pending", chatId, userId];
  const result = await kv.get<string>(key);
  if (result.value) await kv.delete(key);
  return result.value ?? undefined;
}
