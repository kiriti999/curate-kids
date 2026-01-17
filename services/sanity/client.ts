/**
 * Sanity Client Service
 * 
 * Factory for creating Sanity clients with consistent configuration.
 * Wraps client operations with retry logic and proper error handling.
 */

import { createClient, type SanityClient, type ClientConfig } from '@sanity/client'
import { logger } from '../../utils/logger'
import { withRetry } from '../../utils/retry'

/**
 * Create a configured Sanity client
 * 
 * @param config - Sanity client configuration
 * @returns Configured Sanity client instance
 */
export function createSanityClient(config: ClientConfig): SanityClient {
  logger.info('Creating Sanity client', {
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: config.useCdn,
  })

  const client = createClient(config)

  return client
}

/**
 * Fetch data from Sanity with retry logic
 * 
 * @param client - Sanity client instance
 * @param query - GROQ query string
 * @param params - Query parameters
 * @returns Query result or null on failure
 */
export async function fetchWithRetry<T>(
  client: SanityClient,
  query: string,
  params?: Record<string, any>
): Promise<T | null> {
  return withRetry(
    async () => {
      logger.debug('Executing Sanity query', { query, params })
      const result = await client.fetch<T>(query, params)
      logger.debug('Sanity query completed', { resultCount: Array.isArray(result) ? result.length : 1 })
      return result
    },
    {
      shouldRetry: (error) => {
        // Retry on network errors, timeouts, and 5xx errors
        // Don't retry on 4xx errors (authentication, validation, etc.)
        const message = error.message.toLowerCase()
        if (message.includes('401') || message.includes('403') || message.includes('404')) {
          return false
        }
        return true
      },
    }
  )
}

/**
 * Create a document in Sanity with retry logic
 * 
 * @param client - Sanity client instance
 * @param document - Document to create
 * @returns Created document or null on failure
 */
export async function createWithRetry<T>(
  client: SanityClient,
  document: T
): Promise<T | null> {
  return withRetry(
    async () => {
      logger.debug('Creating Sanity document', { type: (document as any)._type })
      const result = await client.create(document)
      logger.debug('Sanity document created', { id: (result as any)._id })
      return result as T
    },
    {
      shouldRetry: (error) => {
        // Don't retry on validation or duplicate errors
        const message = error.message.toLowerCase()
        if (message.includes('validation') || message.includes('conflict') || message.includes('duplicate')) {
          logger.error('Non-retryable error creating document', { error: message })
          return false
        }
        return true
      },
    }
  )
}

/**
 * Update a document in Sanity with retry logic
 * 
 * @param client - Sanity client instance
 * @param documentId - Document ID to update
 * @param patches - Patches to apply
 * @returns Updated document or null on failure
 */
export async function patchWithRetry<T>(
  client: SanityClient,
  documentId: string,
  patches: Record<string, any>
): Promise<T | null> {
  return withRetry(
    async () => {
      logger.debug('Patching Sanity document', { documentId, patches })
      const result = await client.patch(documentId).set(patches).commit()
      logger.debug('Sanity document patched', { id: (result as any)._id })
      return result as T
    },
    {
      shouldRetry: (error) => {
        // Don't retry on validation or not found errors
        const message = error.message.toLowerCase()
        if (message.includes('validation') || message.includes('not found') || message.includes('404')) {
          logger.error('Non-retryable error patching document', { error: message, documentId })
          return false
        }
        return true
      },
    }
  )
}

/**
 * Delete a document in Sanity with retry logic
 * 
 * @param client - Sanity client instance
 * @param documentId - Document ID to delete
 * @returns Deletion result or null on failure
 */
export async function deleteWithRetry(
  client: SanityClient,
  documentId: string
): Promise<any | null> {
  return withRetry(
    async () => {
      logger.debug('Deleting Sanity document', { documentId })
      const result = await client.delete(documentId)
      logger.debug('Sanity document deleted', { documentId })
      return result
    },
    {
      shouldRetry: (error) => {
        // Don't retry on not found errors
        const message = error.message.toLowerCase()
        if (message.includes('not found') || message.includes('404')) {
          logger.error('Non-retryable error deleting document', { error: message, documentId })
          return false
        }
        return true
      },
    }
  )
}
