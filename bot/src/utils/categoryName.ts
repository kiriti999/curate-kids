/**
 * Validation for categories created from Telegram.
 * The slug rule is the same one the website uses (app/api/frontend-categories), so a category
 * made here and one made in the admin screen can never collide under different spellings.
 */

export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 30;
// Telegram limits callback_data to 64 bytes; "cat:<msgId>:<chatId>:" uses up to ~30 of them.
export const CATEGORY_SLUG_MAX = 32;

export type CategoryNameResult =
  | { ok: true; name: string; slug: string }
  | { ok: false; reason: string };

/** Same slug rule as the website: lowercase, anything outside a-z/0-9 becomes a single hyphen. */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Cleans what the user typed and returns the display name plus its slug, or why it was rejected. */
export function normalizeCategoryName(input: string): CategoryNameResult {
  const name = input
    .replace(/[^A-Za-z0-9 &'-]/g, " ") // letters, numbers, spaces, & ' - only (also keeps Markdown safe)
    .replace(/\s+/g, " ")
    .trim();

  if (name.length < CATEGORY_NAME_MIN || name.length > CATEGORY_NAME_MAX) {
    return {
      ok: false,
      reason: `Use ${CATEGORY_NAME_MIN}-${CATEGORY_NAME_MAX} characters (English letters and numbers).`,
    };
  }

  const slug = slugifyCategory(name);
  if (slug.length < CATEGORY_NAME_MIN || slug.length > CATEGORY_SLUG_MAX) {
    return { ok: false, reason: "That name is not usable. Try a shorter one with letters or numbers." };
  }

  return { ok: true, name, slug };
}
