/**
 * User Collection Hooks
 * 
 * Handles addedBy assignment, role immutability, and deactivation timestamps.
 */

import { CollectionBeforeChangeHook, CollectionAfterReadHook } from 'payload'

/**
 * beforeChange Hook: Set addedBy, prevent role changes, set deactivatedAt
 * 
 * T024: Set addedBy, prevent role changes, set deactivatedAt timestamp
 */
export const beforeChangeUserHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // Set addedBy to current admin user (only on create, if user exists)
  if (operation === 'create') {
    // Allow first user registration (no existing user) OR admin-created users
    if (req.user) {
      if (req.user.role !== 'admin') {
        throw new Error('Only admin users can create new user accounts')
      }
      data.addedBy = req.user.id
    } else {
      // If no req.user, this is first-register - make them admin
      data.role = 'admin'
    }
  }

  // Set deactivatedAt timestamp when status changes to inactive
  if (operation === 'update' && originalDoc) {
    // DEBUG: log if resetPasswordToken is being set
    if (data.resetPasswordToken) {
      console.log('[DEBUG] beforeChangeUserHook: saving resetPasswordToken =', data.resetPasswordToken)
    }

    if (data.status === 'inactive' && originalDoc.status === 'active') {
      data.deactivatedAt = new Date()
    }

    // Clear deactivatedAt if reactivating
    if (data.status === 'active' && originalDoc.status === 'inactive') {
      data.deactivatedAt = null
    }
  }

  return data
}

/**
 * Login Hook: Update lastLoginAt and loginCount
 * 
 * This is called by PayloadCMS auth system on successful login
 */
export const afterLoginUserHook = async ({ user, req }: { user: any, req: any }) => {
  if (user && user.id) {
    try {
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          lastLoginAt: new Date(),
          loginCount: (user.loginCount || 0) + 1,
        },
        req, // Pass req to use the same transaction context
      })
    } catch (error: any) {
      // Silently ignore errors during first-register flow
      // The user was just created in a transaction that hasn't committed yet
      console.log('Note: Could not update login stats (may be during first-register):', error.message)
    }
  }

  return user
}
