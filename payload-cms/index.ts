/**
 * Payload Client Helper
 * 
 * Provides a singleton PayloadCMS client for migration scripts
 * and other server-side operations that need direct database access
 */

import payload from 'payload'

let initialized = false

/**
 * Get PayloadCMS client (singleton pattern)
 * 
 * @returns PayloadCMS instance
 */
export async function getPayloadClient() {
  if (!initialized) {
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'fallback-key-please-set-env-var',
      local: true,
    })
    initialized = true
  }
  return payload
}
