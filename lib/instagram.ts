const INSTAGRAM_URL_PATTERN = /instagram\.com\/(?:p|reels?|tv)\/([A-Za-z0-9_-]+)/;

/**
 * Extract an Instagram shortcode from a stored instagramId (which may contain a
 * full URL or trailing query string) or, failing that, from a URL in the title.
 */
export function getInstagramShortcode(
    instagramId: string | null | undefined,
    title: string,
): string {
    const match =
        instagramId?.match(INSTAGRAM_URL_PATTERN) ??
        instagramId?.match(/^([A-Za-z0-9_-]+)/) ??
        title.match(INSTAGRAM_URL_PATTERN);
    return match?.[1] ?? "";
}

export function instagramEmbedUrl(shortcode: string): string {
    return `https://www.instagram.com/reel/${shortcode}/embed/`;
}
