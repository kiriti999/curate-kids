/**
 * Organization Handler
 * 
 * Handles organization-related events:
 * - Bot added to a new group
 * - New member joins group
 * - /link command
 * - /status command
 */

import { Context, InlineKeyboard } from "grammy";
import * as logger from "../utils/logger.ts";
import {
  checkDatabase,
  findOrganizationByGroupId,
  createOrganization,
  deleteOrganizationByGroupId,
  isUserLinked,
  findOrCreateContributor,
  generateLinkUrl,
  isValidTelegramButtonUrl,
  detectAgeRangeFromGroupName,
  unlinkUserFromOrganization,
  removeOrganizationOwner,
} from "../services/organization.ts";

// ============================================================================
// MESSAGES (Links will be sent as inline buttons)
// ============================================================================
const WELCOME_OWNER_MSG = `
👋 <b>Welcome to CuratedReels!</b>

I've detected you're the <b>owner</b> of this group. To manage videos and access the admin panel, please register your account.

After registering:
• You'll be able to approve/reject videos
• Access the web admin panel
• View analytics and reports

<b>Note:</b> Group members can submit videos directly - no registration needed!
`;

const WELCOME_MEMBER_MSG = `
👋 <b>Welcome to CuratedReels!</b>

You can now submit videos to this group by sharing video links here.

No registration needed - just share a YouTube, Facebook, Instagram, or LinkedIn video link!
`;

// Only shown if requireLinking is enabled for the org (optional)
const NOT_LINKED_MSG = `
⚠️ <b>Registration Required</b>

This group requires account registration before submitting videos.

Click the button below to register. This is a one-time setup!
`;

const ALREADY_LINKED_MSG = `
✅ <b>Account Status</b>

Your account is linked!

• <b>Name:</b> {NAME}
• <b>Role:</b> {ROLE}
• <b>Organization:</b> {ORG}

You can submit videos by sharing a video link in this group.
`;

// ============================================================================
// INLINE KEYBOARD BUILDERS
// ============================================================================

/**
 * Create inline keyboard with link button (only works with HTTPS URLs)
 */
function createLinkButton(url: string, text: string): InlineKeyboard {
  return new InlineKeyboard().url(text, url);
}

/**
 * Send message with link - uses button for HTTPS, text for localhost
 */
async function sendMessageWithLink(
  ctx: Context,
  message: string,
  linkUrl: string,
  buttonText: string
): Promise<void> {
  if (isValidTelegramButtonUrl(linkUrl)) {
    // Use inline button for HTTPS URLs
    await ctx.reply(message, {
      parse_mode: "HTML",
      reply_markup: createLinkButton(linkUrl, buttonText),
    });
  } else {
    // Fall back to text link for localhost (copy-paste)
    const messageWithLink = `${message}\n\n🔗 <b>Copy this link:</b>\n<code>${linkUrl}</code>`;
    await ctx.reply(messageWithLink, {
      parse_mode: "HTML",
    });
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Find group owner from administrators
 */
async function findGroupOwner(ctx: Context, chatId: number): Promise<any | null> {
  const admins = await ctx.api.getChatAdministrators(chatId);
  return admins.find((a) => a.status === "creator") || null;
}

/**
 * Send owner welcome message
 */
async function sendOwnerWelcome(
  ctx: Context,
  owner: any,
  chatId: string,
  linked: boolean
): Promise<void> {
  if (linked) {
    await ctx.reply(
      `✅ <b>Welcome back!</b>\n\n` +
      `This group has been set up for CuratedReels.\n\n` +
      `You're already registered as Admin. Members can start submitting videos!`,
      { parse_mode: "HTML" }
    );
    return;
  }

  const linkUrl = generateLinkUrl({
    telegramId: String(owner.user.id),
    telegramUsername: owner.user.username,
    firstName: owner.user.first_name,
    groupId: chatId,
    isOwner: true,
  });
  console.log('🚀 :: sendOwnerWelcome :: linkUrl:', linkUrl)

  await sendMessageWithLink(ctx, WELCOME_OWNER_MSG, linkUrl, "🔗 Register as Admin");
}

/**
 * Set up new organization for group
 */
async function setupNewOrganization(
  ctx: Context,
  chat: any,
  chatId: string,
  chatTitle: string
): Promise<void> {
  const owner = await findGroupOwner(ctx, chat.id);

  if (!owner) {
    logger.warn("Could not find group owner", { chatId });
    await ctx.reply("⚠️ Could not detect group owner. Please contact support.");
    return;
  }

  const ageRange = detectAgeRangeFromGroupName(chatTitle);
  const org = await createOrganization({
    name: chatTitle,
    telegramGroupId: chatId,
    ageRange,
    ownerTelegramId: String(owner.user.id),
  });

  if (!org) {
    await ctx.reply("⚠️ Failed to set up organization. Please try again.");
    return;
  }

  const { linked } = await isUserLinked(String(owner.user.id));
  await sendOwnerWelcome(ctx, owner, chatId, linked);

  logger.info("Group setup complete", {
    orgId: org.id,
    ownerId: owner.user.id,
    ageRange,
    ownerLinked: linked,
  });
}

/**
 * Handle when bot is added to a new group
 */
export async function handleBotAddedToGroup(ctx: Context): Promise<void> {
  const chat = ctx.chat;
  if (!chat || chat.type === "private") return;

  const chatId = String(chat.id);
  const chatTitle = chat.title || "Unnamed Group";

  logger.info("Bot added to group", { chatId, chatTitle });

  const existingOrg = await findOrganizationByGroupId(chatId);
  if (existingOrg) {
    logger.info("Organization already exists", { orgId: existingOrg.id });
    await ctx.reply("I'm already configured for this group! 🎬");
    return;
  }

  try {
    await setupNewOrganization(ctx, chat, chatId, chatTitle);
  } catch (error) {
    logger.error("Error setting up group", { error: String(error) });
    await ctx.reply("⚠️ Error setting up the group. Please try again.");
  }
}

/**
 * Handle when bot is removed from a group
 * Deletes the organization from database
 */
export async function handleBotRemovedFromGroup(ctx: Context): Promise<void> {
  const chat = ctx.chat;
  if (!chat || chat.type === "private") return;

  const chatId = String(chat.id);

  logger.info("Bot removed from group, deleting organization", { chatId });

  try {
    const deleted = await deleteOrganizationByGroupId(chatId);
    if (deleted) {
      logger.info("Organization deleted after bot removal", { chatId });
    } else {
      logger.warn("No organization found to delete", { chatId });
    }
  } catch (error) {
    logger.error("Error deleting organization", { error: String(error) });
  }
}

/**
 * Handle when a new member joins the group
 */
export async function handleNewMember(ctx: Context): Promise<void> {
  const chat = ctx.chat;
  const newMember = ctx.chatMember?.new_chat_member;

  if (!chat || !newMember || chat.type === "private") return;

  // Ignore bots
  if (newMember.user.is_bot) return;

  const chatId = String(chat.id);
  const userId = String(newMember.user.id);

  logger.info("New member joined", {
    chatId,
    userId,
    username: newMember.user.username,
  });

  // Check if user is already linked
  const { linked } = await isUserLinked(userId);
  if (linked) {
    logger.info("User already linked", { userId });
    return; // Don't spam users who are already linked
  }

  // Find organization for this group
  const org = await findOrganizationByGroupId(chatId);
  if (!org) {
    logger.warn("Organization not found for group", { chatId });
    return;
  }

  // Generate link URL
  const linkUrl = generateLinkUrl({
    telegramId: userId,
    telegramUsername: newMember.user.username,
    firstName: newMember.user.first_name,
    groupId: chatId,
    isOwner: false,
  });

  // Send welcome message with link (in private if possible)
  try {
    // Try to send private message
    if (isValidTelegramButtonUrl(linkUrl)) {
      await ctx.api.sendMessage(newMember.user.id, WELCOME_MEMBER_MSG, {
        parse_mode: "HTML",
        reply_markup: createLinkButton(linkUrl, "🔗 Link Your Account"),
      });
    } else {
      const messageWithLink = `${WELCOME_MEMBER_MSG}\n\n🔗 <b>Copy this link:</b>\n<code>${linkUrl}</code>`;
      await ctx.api.sendMessage(newMember.user.id, messageWithLink, {
        parse_mode: "HTML",
      });
    }
  } catch {
    // User hasn't started bot, they'll see the message when they try to post
    logger.info("Could not send DM to new member", { userId });
  }
}

/**
 * Handle /link command
 */
export async function handleLinkCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  const chat = ctx.chat;

  if (!userId || !chat) return;

  // If in group, find organization
  let groupId = "";
  if (chat.type !== "private") {
    groupId = String(chat.id);
  }

  // Check if already linked
  const { linked, user, organization } = await isUserLinked(String(userId));

  if (linked && user) {
    const statusMsg = ALREADY_LINKED_MSG
      .replace("{NAME}", user.name)
      .replace("{ROLE}", user.role)
      .replace("{ORG}", organization?.name || "Unknown");

    await ctx.reply(statusMsg, { parse_mode: "HTML" });
    return;
  }

  // Check if owner (for role assignment)
  let isOwner = false;
  if (groupId) {
    try {
      const admins = await ctx.api.getChatAdministrators(chat.id);
      const owner = admins.find((a) => a.status === "creator");
      isOwner = owner?.user.id === userId;
    } catch {
      // Ignore error
    }
  }

  // Generate link URL
  const linkUrl = generateLinkUrl({
    telegramId: String(userId),
    telegramUsername: ctx.from?.username,
    firstName: ctx.from?.first_name,
    groupId,
    isOwner,
  });

  await sendMessageWithLink(ctx, NOT_LINKED_MSG, linkUrl, "🔗 Link Your Account");
}

/**
 * Handle /status command
 */
export async function handleStatusCommand(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const { linked, user, organization } = await isUserLinked(String(userId));

  if (linked && user) {
    const statusMsg = ALREADY_LINKED_MSG
      .replace("{NAME}", user.name)
      .replace("{ROLE}", user.role)
      .replace("{ORG}", organization?.name || "Unknown");

    await ctx.reply(statusMsg, { parse_mode: "HTML" });
  } else {
    await ctx.reply(
      "❌ Your account is not linked.\n\nUse /link to connect your Telegram account.",
      { parse_mode: "HTML" }
    );
  }
}

/**
 * Validate submission context
 */
function validateSubmissionContext(ctx: Context): {
  valid: boolean;
  userId?: number;
  chatId?: string;
} {
  const userId = ctx.from?.id;
  const chat = ctx.chat;

  if (!userId || !chat || chat.type === "private") {
    return { valid: false };
  }

  return { valid: true, userId, chatId: String(chat.id) };
}

/**
 * Handle required linking flow
 */
async function handleRequiredLinking(
  ctx: Context,
  userId: string,
  chatId: string,
  linked: boolean,
  user: any,
  org: any
): Promise<{ canSubmit: boolean; user?: any }> {
  if (linked) {
    return { canSubmit: true, user };
  }

  const linkUrl = generateLinkUrl({
    telegramId: userId,
    telegramUsername: ctx.from?.username,
    firstName: ctx.from?.first_name,
    groupId: chatId,
    isOwner: false,
  });

  await sendMessageWithLink(ctx, NOT_LINKED_MSG, linkUrl, "🔗 Register Your Account");
  return { canSubmit: false };
}

/**
 * Handle auto-create contributor flow
 */
async function handleAutoCreateContributor(
  ctx: Context,
  userId: string,
  org: any
): Promise<{ canSubmit: boolean; user: any }> {
  const { userId: contributorUserId, isNew } = await findOrCreateContributor({
    telegramId: userId,
    telegramUsername: ctx.from?.username,
    firstName: ctx.from?.first_name,
    organizationId: org.id,
  });

  if (isNew) {
    logger.info("Auto-created contributor user", {
      userId: contributorUserId,
      telegramId: userId,
      orgId: org.id,
    });
  }

  return {
    canSubmit: true,
    user: {
      id: contributorUserId,
      telegramId: userId,
      telegramUsername: ctx.from?.username,
    },
  };
}

/**
 * Check if user can submit videos (middleware helper)
 * Returns the organization and user if allowed, or sends error message
 */
export async function checkCanSubmit(ctx: Context): Promise<{
  canSubmit: boolean;
  organization?: any;
  user?: any;
}> {
  const validation = validateSubmissionContext(ctx);
  if (!validation.valid) {
    return { canSubmit: false };
  }

  const { userId, chatId } = validation;
  const org = await findOrganizationByGroupId(chatId!);

  if (!org) {
    // findOrganizationByGroupId also returns null when the database is unreachable, so tell the
    // two situations apart instead of telling users their group is not configured.
    const databaseUp = await checkDatabase();
    await ctx.reply(
      databaseUp
        ? "⚠️ This group is not configured yet. Please ask the group owner to set up CuratedReels."
        : "⚠️ CuratedReels is temporarily unavailable. Please try again in a few minutes."
    );
    return { canSubmit: false };
  }

  if (org.settings?.requireLinking) {
    const { linked, user } = await isUserLinked(String(userId));
    const result = await handleRequiredLinking(ctx, String(userId!), chatId!, linked, user, org);
    return { ...result, organization: org };
  }

  const result = await handleAutoCreateContributor(ctx, String(userId!), org);
  return { ...result, organization: org };
}

/**
 * Check member status change
 */
function validateMemberRemoval(ctx: Context): {
  valid: boolean;
  chatId?: string;
  userId?: string;
  wasOwner?: boolean;
} {
  const chat = ctx.chat;
  const oldMember = ctx.chatMember?.old_chat_member;
  const newMember = ctx.chatMember?.new_chat_member;

  if (!chat || !oldMember || !newMember || chat.type === "private") {
    return { valid: false };
  }

  if (oldMember.user.is_bot) {
    return { valid: false };
  }

  const wasOwner = oldMember.status === "creator";
  const wasMember = oldMember.status === "member" ||
    oldMember.status === "administrator" ||
    oldMember.status === "creator";
  const isNowGone = newMember.status === "left" || newMember.status === "kicked";

  if (!wasMember || !isNowGone) {
    return { valid: false };
  }

  return {
    valid: true,
    chatId: String(chat.id),
    userId: String(oldMember.user.id),
    wasOwner,
  };
}

/**
 * Process member removal from organization
 */
async function processMemberRemoval(
  chatId: string,
  userId: string,
  wasOwner: boolean
): Promise<void> {
  if (wasOwner) {
    const removed = await removeOrganizationOwner(chatId, userId);
    if (removed) {
      logger.info("Owner removed and unlinked from organization", { chatId, userId });
    }
    return;
  }

  const unlinked = await unlinkUserFromOrganization(userId);
  if (unlinked) {
    logger.info("Member unlinked from organization", { chatId, userId });
  }
}

/**
 * Handle when a member leaves or is kicked from the group
 * Unlinks the user from the organization in CMS
 */
export async function handleMemberRemoved(ctx: Context): Promise<void> {
  const validation = validateMemberRemoval(ctx);
  if (!validation.valid) return;

  const { chatId, userId, wasOwner } = validation;

  logger.info("Member removed from group", {
    chatId,
    userId,
    username: ctx.chatMember?.old_chat_member?.user.username,
    wasOwner,
    newStatus: ctx.chatMember?.new_chat_member?.status,
  });

  try {
    await processMemberRemoval(chatId!, userId!, wasOwner!);
  } catch (error) {
    logger.error("Error handling member removal", { error: String(error) });
  }
}
