/**
 * Cloudinary service for video uploads
 * Uploads videos from Telegram to Cloudinary for permanent storage
 */

import * as logger from "../utils/logger.ts";

export interface CloudinaryUploadResult {
    publicId: string;
    secureUrl: string;
    thumbnailUrl: string;
    duration: number;
    format: string;
    bytes: number;
    width: number;
    height: number;
}

/**
 * Upload a video to Cloudinary from a URL (e.g., Telegram file URL)
 */
export async function uploadVideoFromUrl(
    sourceUrl: string,
    options?: {
        folder?: string;
        publicId?: string;
    }
): Promise<CloudinaryUploadResult | null> {
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
        logger.error("Cloudinary configuration missing", {
            hasCloudName: !!cloudName,
            hasApiKey: !!apiKey,
            hasApiSecret: !!apiSecret,
        });
        return null;
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = options?.folder || "curatedreels/telegram-videos";

        // Build params for signature
        const params: Record<string, string> = {
            folder,
            resource_type: "video",
            timestamp: timestamp.toString(),
        };

        if (options?.publicId) {
            params.public_id = options.publicId;
        }

        // Generate signature
        const signature = await generateSignature(params, apiSecret);

        // Prepare form data
        const formData = new FormData();
        formData.append("file", sourceUrl);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("resource_type", "video");

        if (options?.publicId) {
            formData.append("public_id", options.publicId);
        }

        // Upload to Cloudinary
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

        logger.info("Uploading video to Cloudinary", { folder, sourceUrl: sourceUrl.substring(0, 50) + "..." });

        const response = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Cloudinary upload failed", { status: response.status, error: errorText });
            return null;
        }

        const result = await response.json();

        logger.info("Cloudinary upload successful", {
            publicId: result.public_id,
            duration: result.duration,
            bytes: result.bytes
        });

        // Generate thumbnail URL (Cloudinary auto-generates video thumbnails)
        const thumbnailUrl = result.secure_url
            .replace("/video/upload/", "/video/upload/c_thumb,w_400,h_225,g_auto/")
            .replace(/\.[^.]+$/, ".jpg");

        return {
            publicId: result.public_id,
            secureUrl: result.secure_url,
            thumbnailUrl,
            duration: result.duration || 0,
            format: result.format,
            bytes: result.bytes,
            width: result.width || 0,
            height: result.height || 0,
        };
    } catch (error) {
        logger.error("Cloudinary upload error", {
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}

/**
 * Generate Cloudinary signature for authenticated uploads
 */
async function generateSignature(
    params: Record<string, string>,
    apiSecret: string
): Promise<string> {
    // Sort params alphabetically and create string
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");

    const stringToSign = sortedParams + apiSecret;

    // Generate SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return hashHex;
}

/**
 * Delete a video from Cloudinary
 */
export async function deleteVideo(publicId: string): Promise<boolean> {
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
        logger.error("Cloudinary configuration missing");
        return false;
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const params = {
            public_id: publicId,
            timestamp: timestamp.toString(),
        };

        const signature = await generateSignature(params, apiSecret);

        const formData = new FormData();
        formData.append("public_id", publicId);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`,
            {
                method: "POST",
                body: formData,
            }
        );

        const result = await response.json();
        return result.result === "ok";
    } catch (error) {
        logger.error("Cloudinary delete error", {
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
