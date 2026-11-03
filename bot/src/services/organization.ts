/**
 * Organization Service
 *
 * Handles organization (Telegram group) management:
 * - Creating organizations when bot is added to a group
 * - Linking users to organizations
 * - Checking if a user is linked
 *
 * Uses direct MongoDB access (same as video service) because
 * Payload API requires authentication which the bot doesn't have
 */

import { MongoClient, ObjectId } from "npm:mongodb@6.3.0";
import * as logger from "../utils/logger.ts";

// MongoDB connection
const MONGODB_URI = Deno.env.get("MONGODB_URI") || "";
let mongoClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient | null> {
    if (!MONGODB_URI) {
        logger.error("MONGODB_URI not set");
        return null;
    }

    if (!mongoClient) {
        try {
            mongoClient = new MongoClient(MONGODB_URI);
            await mongoClient.connect();
            logger.info("MongoDB connected for organization service");
        } catch (error) {
            logger.error("Failed to connect to MongoDB", { error: String(error) });
            return null;
        }
    }
    return mongoClient;
}

export async function getDatabase() {
    const client = await getMongoClient();
    if (!client) return null;
    return client.db("curatedreels");
}

// ============================================================================
// TYPES
// ============================================================================

export interface Organization {
    id: string;
    name: string;
    telegramGroupId: string;
    ageRange: string;
    ownerId?: string;
    ownerTelegramId?: string;
    settings?: {
        requireLinking: boolean;
        autoApproveVideos: boolean;
        allowDirectUploads: boolean;
    };
}

export interface LinkedUser {
    id: string;
    email: string;
    name: string;
    telegramId: string;
    telegramUsername?: string;
    organization: string;
    role: "admin" | "contributor" | "viewer";
}

// ============================================================================
// ORGANIZATION FUNCTIONS
// ============================================================================

/**
 * Find organization by Telegram group ID
 */
export async function findOrganizationByGroupId(
    telegramGroupId: string,
): Promise<Organization | null> {
    try {
        const db = await getDatabase();
        if (!db) return null;

        const org = await db.collection("organizations").findOne({
            telegramGroupId: telegramGroupId,
        });

        if (!org) return null;

        return {
            id: org._id.toString(),
            name: org.name,
            telegramGroupId: org.telegramGroupId,
            ageRange: org.ageRange,
            ownerId: org.owner?.toString(),
            ownerTelegramId: org.ownerTelegramId,
            settings: org.settings,
        };
    } catch (error) {
        logger.error("Error finding organization", { error: String(error) });
        return null;
    }
}

/**
 * Create a new organization for a Telegram group
 */
export async function createOrganization(params: {
    name: string;
    telegramGroupId: string;
    ageRange: string;
    ownerTelegramId: string;
}): Promise<Organization | null> {
    // Check env var for default auto-approve setting
    const autoApproveDefault = Deno.env.get("AUTO_APPROVE_VIDEOS") === "true";
    // Check env var for requiring account linking (default: false = contributors can submit directly)
    const requireLinkingDefault = Deno.env.get("REQUIRE_LINKING") === "true";

    try {
        const db = await getDatabase();
        if (!db) return null;

        const doc = {
            name: params.name,
            telegramGroupId: params.telegramGroupId,
            ageRange: params.ageRange,
            ownerTelegramId: params.ownerTelegramId,
            settings: {
                requireLinking: requireLinkingDefault,
                autoApproveVideos: autoApproveDefault,
                allowDirectUploads: true,
            },
            memberCount: 0,
            videoCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection("organizations").insertOne(doc);

        logger.info("Organization created", {
            orgId: result.insertedId.toString(),
            name: params.name,
            autoApprove: autoApproveDefault,
        });

        return {
            id: result.insertedId.toString(),
            name: params.name,
            telegramGroupId: params.telegramGroupId,
            ageRange: params.ageRange,
            ownerTelegramId: params.ownerTelegramId,
            settings: doc.settings,
        };
    } catch (error) {
        logger.error("Error creating organization", { error: String(error) });
        return null;
    }
}

/**
 * Build unlink query for organization members
 */
function buildUnlinkQuery(org: any): any {
    const orgIdString = org._id.toString();
    const baseConditions: any[] = [
        { organization: org._id },
        { organization: orgIdString },
    ];

    if (org.ownerTelegramId) {
        baseConditions.push({ telegramId: org.ownerTelegramId });
    }

    return { $or: baseConditions };
}

/**
 * Unlink users from organization
 */
async function unlinkOrganizationUsers(db: any, org: any): Promise<void> {
    const orgIdString = org._id.toString();
    const query = buildUnlinkQuery(org);

    const unlinkResult = await db.collection("users").updateMany(query, {
        $set: {
            organization: null,
            telegramId: null,
            telegramUsername: null,
            telegramFirstName: null,
        },
    });

    logger.info("Users unlink attempt", {
        telegramGroupId: org.telegramGroupId,
        orgId: orgIdString,
        ownerTelegramId: org.ownerTelegramId,
        matchedCount: unlinkResult.matchedCount,
        modifiedCount: unlinkResult.modifiedCount,
    });
}

/**
 * Delete organization by Telegram group ID
 * Called when bot is removed from group
 * Also unlinks all users associated with this organization
 */
export async function deleteOrganizationByGroupId(
    telegramGroupId: string,
): Promise<boolean> {
    try {
        const db = await getDatabase();
        if (!db) return false;

        const org = await db
            .collection("organizations")
            .findOne({ telegramGroupId });

        logger.info("Attempting to delete organization", {
            telegramGroupId,
            orgFound: !!org,
            orgId: org?._id?.toString(),
        });

        if (org) {
            await unlinkOrganizationUsers(db, org);
        }

        const result = await db.collection("organizations").deleteOne({
            telegramGroupId,
        });

        if (result.deletedCount > 0) {
            logger.info("Organization deleted", { telegramGroupId });
            return true;
        }

        return false;
    } catch (error) {
        logger.error("Error deleting organization", { error: String(error) });
        return false;
    }
}

/**
 * Unlink a specific user from their organization
 * Called when owner/member is removed from the group
 */
export async function unlinkUserFromOrganization(
    telegramId: string,
): Promise<boolean> {
    try {
        const db = await getDatabase();
        if (!db) return false;

        const result = await db.collection("users").updateOne(
            { telegramId },
            {
                $set: {
                    organization: null,
                    telegramId: null,
                    telegramUsername: null,
                    telegramFirstName: null,
                },
            },
        );

        if (result.modifiedCount > 0) {
            logger.info("User unlinked from organization", { telegramId });
            return true;
        }

        return false;
    } catch (error) {
        logger.error("Error unlinking user", { error: String(error) });
        return false;
    }
}

/**
 * Remove owner from organization (when owner leaves/is kicked)
 * Sets organization owner to null
 */
export async function removeOrganizationOwner(
    telegramGroupId: string,
    ownerTelegramId: string,
): Promise<boolean> {
    try {
        const db = await getDatabase();
        if (!db) return false;

        // Update organization to remove owner
        const orgResult = await db.collection("organizations").updateOne(
            { telegramGroupId, ownerTelegramId },
            {
                $set: {
                    owner: null,
                    ownerTelegramId: null,
                },
            },
        );

        // Also unlink the user
        await unlinkUserFromOrganization(ownerTelegramId);

        if (orgResult.modifiedCount > 0) {
            logger.info("Owner removed from organization", {
                telegramGroupId,
                ownerTelegramId,
            });
            return true;
        }

        return false;
    } catch (error) {
        logger.error("Error removing organization owner", { error: String(error) });
        return false;
    }
}

/**
 * Check if videos should be auto-approved for an organization
 * Priority: Organization setting > Environment variable > Default (true)
 * Note: Default is true since videos come from approved Telegram channels
 */
export function shouldAutoApproveVideos(
    organization?: Organization | null,
): boolean {
    // 1. Check organization setting
    if (organization?.settings?.autoApproveVideos !== undefined) {
        return organization.settings.autoApproveVideos;
    }

    // 2. Fall back to environment variable
    const envSetting = Deno.env.get("AUTO_APPROVE_VIDEOS");
    if (envSetting !== undefined) {
        return envSetting === "true";
    }

    // 3. Default: auto-approve (videos come from approved Telegram channels)
    return true;
}

// ============================================================================
// USER LINKING FUNCTIONS
// ============================================================================

/**
 * Find user by Telegram ID
 */
export async function findUserByTelegramId(
    telegramId: string,
): Promise<LinkedUser | null> {
    try {
        const db = await getDatabase();
        if (!db) return null;

        const user = await db.collection("users").findOne({ telegramId });

        if (!user) return null;

        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            telegramId: user.telegramId,
            telegramUsername: user.telegramUsername,
            organization: user.organization?.toString(),
            role: user.role,
        };
    } catch (error) {
        logger.error("Error finding user by Telegram ID", { error: String(error) });
        return null;
    }
}

/**
 * Check if a Telegram user is linked to an organization
 */
export async function isUserLinked(telegramId: string): Promise<{
    linked: boolean;
    user?: LinkedUser;
    organization?: Organization;
}> {
    const user = await findUserByTelegramId(telegramId);

    if (!user) {
        return { linked: false };
    }

    // User is linked if they have a telegramId in the database
    // They are considered "linked" even without an organization

    // Check if they have an organization
    if (user.organization) {
        const org = await findOrganizationById(user.organization);
        if (org) {
            return { linked: true, user, organization: org };
        }
    }

    // User exists with telegramId but no organization - still considered linked
    return { linked: true, user };
}

/**
 * Find organization by ID
 */
async function findOrganizationById(
    orgId: string,
): Promise<Organization | null> {
    try {
        const db = await getDatabase();
        if (!db) return null;

        const org = await db.collection("organizations").findOne({
            _id: new ObjectId(orgId),
        });

        if (!org) return null;

        return {
            id: org._id.toString(),
            name: org.name,
            telegramGroupId: org.telegramGroupId,
            ageRange: org.ageRange,
            ownerId: org.owner?.toString(),
            ownerTelegramId: org.ownerTelegramId,
            settings: org.settings,
        };
    } catch {
        return null;
    }
}

/**
 * Check if user is an organization owner (group creator)
 */
export async function isOrganizationOwner(
    telegramId: string,
    organizationId: string,
): Promise<boolean> {
    try {
        const org = await findOrganizationById(organizationId);
        return org?.ownerTelegramId === telegramId;
    } catch {
        return false;
    }
}

/**
 * Create contributor document
 */
function buildContributorDocument(params: {
    telegramId: string;
    telegramUsername?: string;
    firstName?: string;
    organizationId?: string;
}): any {
    return {
        email: `telegram-${params.telegramId}@contributor.local`,
        name: params.firstName || `Telegram User ${params.telegramId}`,
        telegramId: params.telegramId,
        telegramUsername: params.telegramUsername,
        telegramFirstName: params.firstName,
        telegramLinkedAt: new Date(),
        role: "contributor",
        organization: params.organizationId
            ? new ObjectId(params.organizationId)
            : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Find or create a contributor user
 * Contributors are auto-created with just Telegram info (no CMS login)
 */
export async function findOrCreateContributor(params: {
    telegramId: string;
    telegramUsername?: string;
    firstName?: string;
    organizationId?: string;
}): Promise<{ userId: string | null; isNew: boolean }> {
    const existingUser = await findUserByTelegramId(params.telegramId);
    if (existingUser) {
        return { userId: existingUser.id, isNew: false };
    }

    try {
        const db = await getDatabase();
        if (!db) return { userId: null, isNew: false };

        const doc = buildContributorDocument(params);
        const result = await db.collection("users").insertOne(doc);
        const userId = result.insertedId.toString();

        logger.info("Contributor user created", {
            userId,
            telegramId: params.telegramId,
        });
        return { userId, isNew: true };
    } catch (error) {
        logger.error("Error creating contributor user", { error: String(error) });
        return { userId: null, isNew: false };
    }
}

// ============================================================================
// LINK GENERATION
// ============================================================================

/**
 * Check if a URL is valid for Telegram inline buttons
 * Telegram requires HTTPS URLs (not localhost/http)
 */
export function isValidTelegramButtonUrl(url: string): boolean {
    return url.startsWith("https://");
}

/**
 * Generate a link URL for account linking
 */
export function generateLinkUrl(params: {
    telegramId: string;
    telegramUsername?: string;
    firstName?: string;
    groupId: string;
    isOwner: boolean;
}): string {
    // Use CMS_URL for authentication/linking, fallback to FRONTEND_URL for backward compatibility
    const cmsUrl =
        Deno.env.get("CMS_URL") ||
        Deno.env.get("FRONTEND_URL") ||
        "http://localhost:3000";
    console.log("🔗 generateLinkUrl using cmsUrl:", cmsUrl);

    const queryParams = new URLSearchParams({
        tg: params.telegramId,
        group: params.groupId,
        role: params.isOwner ? "admin" : "contributor",
    });

    if (params.telegramUsername) {
        queryParams.append("username", params.telegramUsername);
    }
    if (params.firstName) {
        queryParams.append("name", params.firstName);
    }

    return `${cmsUrl}/link?${queryParams.toString()}`;
}

/**
 * Determine age range from group name
 *
 * @deprecated Age ranges are no longer tied to groups. Each video now has
 * its own age range selected by the user. This function returns an empty
 * string for backward compatibility.
 *
 * Organizations no longer need an age range field as videos are submitted
 * with user-selected age ranges via inline keyboards.
 */
export function detectAgeRangeFromGroupName(groupName: string): string {
    // Age ranges are now selected per video, not per group
    // Return empty string for organizations
    return "";
}

/**
 * Who a submission belongs to: the linked account of the sender and the
 * organization of the group (or, in a private chat, the sender's own).
 * Videos need both so the website can keep each user's videos separate.
 */
export async function resolveSubmitter(
    chatType: string | undefined,
    chatId: number,
    telegramUserId: number,
): Promise<{ organizationId?: string; submittedByUserId?: string }> {
    const user = await findUserByTelegramId(String(telegramUserId));
    let organizationId = user?.organization;

    if (chatType !== "private") {
        const org = await findOrganizationByGroupId(String(chatId));
        organizationId = org?.id ?? organizationId;
    }

    return { organizationId, submittedByUserId: user?.id };
}
