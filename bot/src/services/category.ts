/**
 * Categories for the Telegram flow.
 *
 * The list shown on the keyboard is the built-in defaults plus every visible category in the CMS
 * `categories` collection, so a category made in the admin screen, on the website, or here is
 * available everywhere. Creating one here writes the same fields the website's admin screen writes.
 */

import * as logger from "../utils/logger.ts";
import { getDatabase } from "./organization.ts";
import { CATEGORIES, type CategoryChoice } from "../utils/keyboard.ts";
import { CATEGORY_SLUG_MAX, normalizeCategoryName } from "../utils/categoryName.ts";

const kv = await Deno.openKv();

/** Keeps the keyboard well inside Telegram's 100-button limit. */
export const MAX_CATEGORIES = 60;
const CREATE_COOLDOWN_MS = 20_000;

export type CreateCategoryResult =
  | { status: "created" | "exists"; name: string; slug: string }
  | { status: "invalid"; reason: string }
  | { status: "limit" | "rate_limited" | "error" };

/** Built-in categories first (keeps their emoji labels), then CMS-only ones. Never throws. */
export async function listCategories(): Promise<CategoryChoice[]> {
  const defaults: CategoryChoice[] = CATEGORIES.map((c) => ({ value: c.value, label: c.label }));
  try {
    const db = await getDatabase();
    if (!db) return defaults;

    const docs = await db
      .collection("categories")
      .find({ isVisible: { $ne: false }, isAgeRangeRoot: { $ne: true }, parent: null })
      .sort({ sortOrder: 1 })
      .limit(MAX_CATEGORIES)
      .project({ name: 1, slug: 1 })
      .toArray();

    const known = new Set(defaults.map((d) => d.value));
    const extras: CategoryChoice[] = [];
    for (const doc of docs) {
      const slug = String(doc.slug ?? "");
      // Slugs longer than the callback_data budget can't be put on a button.
      if (!slug || known.has(slug) || slug.length > CATEGORY_SLUG_MAX) continue;
      known.add(slug);
      extras.push({ value: slug, label: `🏷️ ${String(doc.name ?? slug)}` });
    }
    return [...defaults, ...extras].slice(0, MAX_CATEGORIES);
  } catch (error) {
    logger.error("Could not load categories, using the built-in list", { error: String(error) });
    return defaults;
  }
}

async function onCooldown(userId: number): Promise<boolean> {
  const entry = await kv.get(["category_create", userId]);
  return entry.value !== null;
}

async function startCooldown(userId: number): Promise<void> {
  await kv.set(["category_create", userId], true, { expireIn: CREATE_COOLDOWN_MS });
}

/** Creates a category from what the user typed. Returns "exists" (not an error) if it is already there. */
export async function createCategory(rawName: string, userId: number): Promise<CreateCategoryResult> {
  const parsed = normalizeCategoryName(rawName);
  if (!parsed.ok) return { status: "invalid", reason: parsed.reason };
  const { name, slug } = parsed;

  const builtIn = CATEGORIES.find((c) => c.value === slug);
  if (builtIn) return { status: "exists", name: builtIn.label, slug };

  try {
    const db = await getDatabase();
    if (!db) return { status: "error" };
    const collection = db.collection("categories");

    const existing = await collection.findOne({ slug });
    if (existing) return { status: "exists", name: String(existing.name ?? name), slug };

    if (await onCooldown(userId)) return { status: "rate_limited" };
    if ((await collection.countDocuments({})) >= MAX_CATEGORIES) return { status: "limit" };

    const last = await collection.find({}).sort({ sortOrder: -1 }).limit(1).project({ sortOrder: 1 }).toArray();
    const sortOrder = Number(last[0]?.sortOrder ?? -1) + 1;
    const now = new Date();

    try {
      await collection.insertOne({
        name,
        slug,
        description: "",
        depth: 0,
        isAgeRangeRoot: false,
        isVisible: true,
        sortOrder,
        childCount: 0,
        videoCount: 0,
        notes: `Created from Telegram by user ${userId}`,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      // Two people creating the same name at once: the unique slug index lets only one through.
      if ((error as { code?: number }).code === 11000) return { status: "exists", name, slug };
      throw error;
    }

    await startCooldown(userId);
    logger.info("Category created from Telegram", { slug, userId });
    return { status: "created", name, slug };
  } catch (error) {
    logger.error("Failed to create category", { error: String(error) });
    return { status: "error" };
  }
}
