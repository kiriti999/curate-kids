/**
 * Telegram Account Linking Service
 * 
 * Business logic for linking Telegram accounts to CuratedReels users
 */

import { Payload } from 'payload'

export interface LinkAccountParams {
  telegramId: string
  telegramUsername?: string
  telegramFirstName?: string
  groupId?: string
  role?: string
}

export interface LinkAccountResult {
  success: boolean
  message: string
  user: {
    id: string | number
    telegramId: string
    organization: string | null
    role: string
  }
}

/**
 * Check if Telegram ID is already linked to another user
 */
export async function validateTelegramIdNotLinked(
  payload: Payload,
  telegramId: string,
  currentUserId: string | number
): Promise<boolean> {
  const existingUser = await payload.find({
    collection: 'users',
    where: {
      telegramId: { equals: telegramId },
      id: { not_equals: currentUserId },
    },
    limit: 1,
  })

  return existingUser.docs.length === 0
}

/**
 * Find organization by Telegram group ID
 */
export async function findOrganizationByGroupId(
  payload: Payload,
  groupId: string
): Promise<string | null> {
  const org = await payload.find({
    collection: 'organizations',
    where: {
      telegramGroupId: { equals: groupId },
    },
    limit: 1,
  })

  return org.docs.length > 0 ? org.docs[0].id : null
}

/**
 * Update organization when user links account
 */
export async function updateOrganizationForUser(
  payload: Payload,
  organizationId: string,
  telegramId: string,
  userId: string | number
): Promise<void> {
  const organization = await payload.findByID({
    collection: 'organizations',
    id: organizationId,
  }) as any

  const isOwner = organization.ownerTelegramId === telegramId
  const memberCount = (organization.memberCount || 0) + 1

  const updateData: any = {
    memberCount,
    ageRange: undefined, // Clear age range (no longer used)
  }

  if (isOwner) {
    updateData.owner = userId
  }

  await payload.update({
    collection: 'organizations',
    id: organizationId,
    data: updateData,
  })
}

/**
 * Determine user role based on organization ownership
 */
export async function determineUserRole(
  payload: Payload,
  organizationId: string | null,
  telegramId: string,
  currentRole?: string
): Promise<string> {
  if (!organizationId) {
    return currentRole || 'contributor'
  }

  const org = await payload.findByID({
    collection: 'organizations',
    id: organizationId,
  }) as any

  const isOwner = org.ownerTelegramId === telegramId
  return isOwner ? 'admin' : (currentRole || 'contributor')
}

/**
 * Determine if role should be updated
 */
function shouldUpdateRole(userRole: string, currentRole?: string): boolean {
  return !currentRole || (userRole === 'admin' && currentRole !== 'admin')
}

/**
 * Build user update data for linking Telegram account
 */
export function buildUserUpdateData(
  params: LinkAccountParams,
  organizationId: string | null,
  userRole: string,
  currentRole?: string
): any {
  const updateData: any = {
    telegramId: params.telegramId,
    telegramUsername: params.telegramUsername || undefined,
    telegramFirstName: params.telegramFirstName || undefined,
    telegramLinkedAt: new Date().toISOString(),
    organization: organizationId || undefined,
  }

  if (shouldUpdateRole(userRole, currentRole)) {
    updateData.role = userRole
  }

  return updateData
}
