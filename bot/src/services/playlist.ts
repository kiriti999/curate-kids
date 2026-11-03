/**
 * Playlist Service
 *
 * Creates playlists and adds videos to them for linked Telegram users.
 * Uses direct MongoDB access (like the video and organization services) and
 * writes documents in the shape of the PayloadCMS `playlists` collection.
 */

import { ObjectId } from "npm:mongodb@6.3.0";
import * as logger from "../utils/logger.ts";
import { getDatabase } from "./organization.ts";
import { slugify } from "./payload.ts";

export interface PlaylistSummary {
  id: string;
  title: string;
}

/** Most recently updated playlists owned by a user */
export async function listRecentPlaylists(
  ownerId: string,
  limit = 5,
): Promise<PlaylistSummary[]> {
  try {
    const db = await getDatabase();
    if (!db) return [];

    const docs = await db
      .collection("playlists")
      .find({ owner: new ObjectId(ownerId) })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return docs.map((d) => ({ id: d._id.toString(), title: d.title }));
  } catch (error) {
    logger.error("Error listing playlists", { error: String(error) });
    return [];
  }
}

/** Create a playlist containing one video. Returns the playlist ID or null. */
export async function createPlaylistWithVideo(params: {
  ownerId: string;
  organizationId?: string;
  title: string;
  videoId: string;
}): Promise<string | null> {
  try {
    const db = await getDatabase();
    if (!db) return null;

    const title = params.title.trim().slice(0, 120);
    const now = new Date();
    const result = await db.collection("playlists").insertOne({
      title,
      // Random suffix keeps slugs unique when titles collide
      slug: `${slugify(title) || "playlist"}-${crypto.randomUUID().slice(0, 5)}`,
      owner: new ObjectId(params.ownerId),
      organization: params.organizationId
        ? new ObjectId(params.organizationId)
        : undefined,
      isPublic: false,
      items: [{ id: new ObjectId(), video: new ObjectId(params.videoId) }],
      createdAt: now,
      updatedAt: now,
    });
    return result.insertedId.toString();
  } catch (error) {
    logger.error("Error creating playlist", { error: String(error) });
    return null;
  }
}

/**
 * Append a video to a playlist the user owns.
 * Returns "added", "exists" (already in the playlist) or "failed".
 */
export async function addVideoToPlaylist(params: {
  ownerId: string;
  playlistId: string;
  videoId: string;
}): Promise<{ status: "added" | "exists" | "failed"; title?: string }> {
  try {
    const db = await getDatabase();
    if (!db) return { status: "failed" };

    const playlists = db.collection("playlists");
    const video = new ObjectId(params.videoId);
    const filter = {
      _id: new ObjectId(params.playlistId),
      owner: new ObjectId(params.ownerId),
    };

    const result = await playlists.findOneAndUpdate(
      { ...filter, "items.video": { $ne: video } },
      {
        $push: { items: { id: new ObjectId(), video } } as never,
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );
    if (result) return { status: "added", title: result.title };

    // No match: either not ours / missing, or the video is already in it
    const existing = await playlists.findOne(filter);
    return existing
      ? { status: "exists", title: existing.title }
      : { status: "failed" };
  } catch (error) {
    logger.error("Error adding video to playlist", { error: String(error) });
    return { status: "failed" };
  }
}
