/**
 * Organization Hooks
 * 
 * Handles organization lifecycle events:
 * - Unlinking users when organization is deleted
 */

import type { CollectionAfterDeleteHook } from 'payload'

/**
 * After organization is deleted, unlink all associated users
 * This ensures users don't have references to deleted organizations
 */
export const afterDeleteOrganizationHook: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const { payload } = req
  const deletedOrgId = doc.id

  try {
    // Find all users linked to this organization
    const usersToUnlink = await payload.find({
      collection: 'users',
      where: {
        organization: {
          equals: deletedOrgId,
        },
      },
      limit: 1000,
    })

    if (usersToUnlink.docs.length > 0) {
      payload.logger.info(
        `Unlinking ${usersToUnlink.docs.length} users from deleted organization ${deletedOrgId}`
      )

      // Unlink each user - set fields to null
      for (const user of usersToUnlink.docs) {
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            organization: null,
            telegramId: null,
            telegramUsername: null,
            telegramFirstName: null,
          } as any,
        })
      }

      payload.logger.info(
        `Successfully unlinked ${usersToUnlink.docs.length} users from deleted organization`
      )
    }
  } catch (error) {
    payload.logger.error(
      `Error unlinking users from deleted organization: ${error}`
    )
  }

  return doc
}
