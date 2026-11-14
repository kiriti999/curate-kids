/**
 * Meta oEmbed service
 *
 * Fetches a thumbnail for public Instagram posts/reels using Meta's
 * instagram_oembed endpoint. Requires META_APP_ID and META_APP_SECRET.
 * Returns null on any failure so submissions still go through without a thumbnail.
 */

import * as logger from "../utils/logger.ts";

const GRAPH_API_VERSION = "v21.0";

export interface InstagramOembed {
  thumbnailUrl: string | null;
  title: string | null;
}

/**
 * Look up an Instagram post's oEmbed data (thumbnail and title)
 * @param url - Public Instagram post, reel, or IGTV URL
 * @returns oEmbed data, or null if credentials are missing or the request fails
 */
export async function getInstagramOembed(url: string): Promise<InstagramOembed | null> {
  const appId = Deno.env.get("META_APP_ID");
  const appSecret = Deno.env.get("META_APP_SECRET");
  if (!appId || !appSecret) {
    logger.warn("META_APP_ID or META_APP_SECRET not set, skipping Instagram thumbnail");
    return null;
  }

  const params = new URLSearchParams({
    url,
    access_token: `${appId}|${appSecret}`,
    omitscript: "true",
  });
  const endpoint = `https://graph.facebook.com/${GRAPH_API_VERSION}/instagram_oembed?${params}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      // Log status only; the response body may echo back request details
      logger.warn("Instagram oEmbed request failed", { status: response.status });
      return null;
    }
    const data = await response.json();
    return {
      thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : null,
      title: typeof data.title === "string" ? data.title : null,
    };
  } catch (error) {
    logger.error("Instagram oEmbed request error", { error: String(error) });
    return null;
  }
}
