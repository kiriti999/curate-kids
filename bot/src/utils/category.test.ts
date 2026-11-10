import { assertEquals, assert } from "jsr:@std/assert@^1";
import { CATEGORY_SLUG_MAX, normalizeCategoryName, slugifyCategory } from "./categoryName.ts";
import {
  buildCategoryKeyboard,
  parseCallbackData,
  parseNewCategoryData,
  type CategoryChoice,
} from "./keyboard.ts";

Deno.test("slug rule matches the website's (same input, same slug)", () => {
  assertEquals(slugifyCategory("Arts & Crafts"), "arts-crafts");
  assertEquals(slugifyCategory("  Yoga  "), "yoga");
  assertEquals(slugifyCategory("Science -- Fun!"), "science-fun");
});

Deno.test("normalizeCategoryName accepts ordinary names", () => {
  assertEquals(normalizeCategoryName("Yoga"), { ok: true, name: "Yoga", slug: "yoga" });
  assertEquals(normalizeCategoryName("  Arts   &  Crafts "), { ok: true, name: "Arts & Crafts", slug: "arts-crafts" });
  assertEquals(normalizeCategoryName("Kid's Cooking"), { ok: true, name: "Kid's Cooking", slug: "kid-s-cooking" });
});

Deno.test("normalizeCategoryName strips markup so Markdown/HTML can't be injected", () => {
  const result = normalizeCategoryName("*bold* _x_ `code` <b>hi</b> [a](b)");
  assert(result.ok);
  if (result.ok) assertEquals(/[*_`<>\[\]()]/.test(result.name), false);
});

Deno.test("normalizeCategoryName rejects unusable input", () => {
  assertEquals(normalizeCategoryName("a").ok, false); // too short
  assertEquals(normalizeCategoryName("x".repeat(31)).ok, false); // too long
  assertEquals(normalizeCategoryName("🙂🙂🙂").ok, false); // nothing usable left
  assertEquals(normalizeCategoryName("योग").ok, false); // no a-z/0-9 for a slug
  assertEquals(normalizeCategoryName("   ").ok, false);
});

Deno.test("a longest allowed name still gives a slug within the button budget", () => {
  const result = normalizeCategoryName("a".repeat(30));
  assert(result.ok);
  if (result.ok) assert(result.slug.length <= CATEGORY_SLUG_MAX);
});

Deno.test("every button stays within Telegram's 64-byte callback_data limit at the worst case", () => {
  const categories: CategoryChoice[] = Array.from({ length: 60 }, (_, i) => ({
    value: `${"a".repeat(CATEGORY_SLUG_MAX - 2)}${String(i).padStart(2, "0")}`,
    label: `🏷️ Category ${i}`,
  }));
  const keyboard = buildCategoryKeyboard(9_999_999_999, -1_009_999_999_999, categories);
  const buttons = keyboard.inline_keyboard.flat();

  assert(buttons.length <= 100, "Telegram allows at most 100 buttons");
  for (const button of buttons) {
    const data = (button as { callback_data?: string }).callback_data ?? "";
    assert(new TextEncoder().encode(data).length <= 64, `callback_data too long: ${data}`);
  }
});

Deno.test("keyboard ends with the New category button and parsers round-trip", () => {
  const keyboard = buildCategoryKeyboard(51, -5119333414, [{ value: "music", label: "🎵 Music" }]);
  const rows = keyboard.inline_keyboard;
  const last = rows[rows.length - 1][0] as { callback_data: string };

  assertEquals(last.callback_data, "catnew:51:-5119333414");
  assertEquals(parseNewCategoryData(last.callback_data), { messageId: 51, chatId: -5119333414 });
  assertEquals(parseCallbackData("cat:51:-5119333414:music"), { messageId: 51, chatId: -5119333414, category: "music" });
  assertEquals(parseNewCategoryData("catnew:x:1"), null);
  assertEquals(parseNewCategoryData("cat:51:1:music"), null);
});
