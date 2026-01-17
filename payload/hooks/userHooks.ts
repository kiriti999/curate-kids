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
  // Set addedBy to current admin user (only on create)
  if (operation === 'create' && req.user) {
    // Ensure the current user is an admin
    if (req.user.role !== 'admin') {
      throw new Error('Only admin users can create new user accounts')
    }
    
    data.addedBy = req.user.id
  }

  // Prevent role changes after initial creation (immutable)
  if (operation === 'update' && originalDoc) {
    if (data.role && data.role !== originalDoc.role) {
      throw new Error('User role cannot be changed after account creation')
    }
  }

  // Set deactivatedAt timestamp when status changes to inactive
  if (operation === 'update' && originalDoc) {
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
export const afterLoginUserHook = async ({ user, req }) => {
  if (user && user.id) {
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: {
        lastLoginAt: new Date(),
        loginCount: (user.loginCount || 0) + 1,
      },
    })
  }

  return user
}
