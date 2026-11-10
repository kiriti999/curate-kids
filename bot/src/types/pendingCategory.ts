/**
 * Pending "type the new category name" state - Deno KV, short-lived.
 * Set when a user taps "New category"; consumed by their next text reply in that chat.
 */

const kv = await Deno.openKv();
const TTL_MS = 5 * 60 * 1000;

/** `messageId` is the id of the video message the category choice belongs to. */
export async function setPendingCategory(chatId: number, userId: number, messageId: number): Promise<void> {
  await kv.set(["category_pending", chatId, userId], messageId, { expireIn: TTL_MS });
}

export async function takePendingCategory(chatId: number, userId: number): Promise<number | undefined> {
  const key = ["category_pending", chatId, userId];
  const result = await kv.get<number>(key);
  if (result.value !== null && result.value !== undefined) await kv.delete(key);
  return result.value ?? undefined;
}
