/**
 * Payload Client Helper
 * 
 * Provides a singleton PayloadCMS client for migration scripts
 * and other server-side operations that need direct database access
 */

import { getPayload } from 'payload'
import config from './payload.config.js'

let cachedPayload: any = null

/**
 * Get PayloadCMS client (singleton pattern)
 * 
 * @returns PayloadCMS instance
 */
export async function getPayloadClient() {
  if (cachedPayload) {
    return cachedPayload
  }

  cachedPayload = await getPayload({ config })
  return cachedPayload
}
