/**
 * One-time backfill: fetch Instagram thumbnails for videos saved before
 * thumbnail lookup existed.
 *
 * Usage (from bot/):
 *   deno run --allow-net --allow-env --allow-read --env=.env scripts/backfill-instagram-thumbnails.ts          # dry run
 *   deno run --allow-net --allow-env --allow-read --env=.env scripts/backfill-instagram-thumbnails.ts --apply  # write
 *
 * Requires MONGODB_URI, META_APP_ID and META_APP_SECRET in the environment.
 * Only updates documents whose thumbnailUrl is missing or empty.
 */

import { MongoClient } from "npm:mongodb@6.3.0";
import { getInstagramOembed } from "../src/services/metaOembed.ts";

const DB_NAME = "curatedreels";
const COLLECTION = "videos";
const DELAY_MS = 500; // stay well under Meta's rate limits

const apply = Deno.args.includes("--apply");
const mongoUri = Deno.env.get("MONGODB_URI");
if (!mongoUri) {
  console.error("MONGODB_URI is not set");
  Deno.exit(1);
}

const client = new MongoClient(mongoUri);
await client.connect();
const videos = client.db(DB_NAME).collection(COLLECTION);

const pending = await videos
  .find({
    instagramId: { $exists: true, $nin: [null, ""] },
    $or: [
      { thumbnailUrl: { $exists: false } },
      { thumbnailUrl: null },
      { thumbnailUrl: "" },
    ],
  })
  .project({ _id: 1, title: 1, instagramId: 1 })
  .toArray();

console.log(`${pending.length} Instagram video(s) without a thumbnail. Mode: ${apply ? "APPLY" : "DRY RUN"}`);

let updated = 0;
let missed = 0;

for (const doc of pending) {
  const shortcode = String(doc.instagramId);
  // Instagram shortcodes work under either path; try reel first, then post
  const candidates = [
    `https://www.instagram.com/reel/${shortcode}/`,
    `https://www.instagram.com/p/${shortcode}/`,
  ];

  let thumbnailUrl: string | null = null;
  for (const url of candidates) {
    const oembed = await getInstagramOembed(url);
    if (oembed?.thumbnailUrl) {
      thumbnailUrl = oembed.thumbnailUrl;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  if (!thumbnailUrl) {
    missed++;
    console.log(`  MISS  ${doc._id}  ${doc.title}`);
    continue;
  }

  if (apply) {
    await videos.updateOne({ _id: doc._id }, { $set: { thumbnailUrl } });
  }
  updated++;
  console.log(`  ${apply ? "SET " : "WOULD"}  ${doc._id}  ${doc.title}`);
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

console.log(`Done. ${apply ? "Updated" : "Would update"}: ${updated}, no thumbnail found: ${missed}`);
await client.close();
