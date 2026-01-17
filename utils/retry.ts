/**
 * Retry Utility
 * 
 * Provides exponential backoff retry logic for async operations.
 * Used to handle transient failures in external API calls.
 */

import { logger } from './logger'
import { RETRY_CONFIG } from '../config/constants'

interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  shouldRetry?: (error: Error) => boolean
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: RETRY_CONFIG.MAX_RETRIES,
  baseDelayMs: RETRY_CONFIG.BASE_DELAY_MS,
  shouldRetry: () => true,
}

/**
 * Delay execution for specified milliseconds
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable based on custom logic
 * 
 * @param error - Error to check
 * @param shouldRetry - Custom retry predicate function
 * @returns True if error should trigger retry, false otherwise
 */
function isRetryable(error: Error, shouldRetry: (error: Error) => boolean): boolean {
  const result = shouldRetry(error)
  if (!result) {
    logger.error('Operation failed with non-retryable error', {
      error: error.message,
    })
  }
  return result
}

/**
 * Calculate exponential backoff delay for retry attempt
 * 
 * @param baseDelayMs - Base delay in milliseconds
 * @param attempt - Current retry attempt number (1-indexed)
 * @returns Calculated delay in milliseconds (exponential backoff)
 */
function calculateDelay(baseDelayMs: number, attempt: number): number {
  return baseDelayMs * Math.pow(2, attempt - 1)
}

/**
 * Log retry attempt with context
 * 
 * @param error - Error that triggered retry
 * @param attempt - Current retry attempt number
 * @param delayMs - Delay before next retry in milliseconds
 */
function logRetryAttempt(error: Error, attempt: number, delayMs: number): void {
  logger.warn('Operation failed, retrying', {
    error: error.message,
    attempt,
    nextRetryInMs: delayMs,
  })
}

/**
 * Execute a single attempt of an operation
 * 
 * @param operation - Async operation to execute
 * @param attempt - Current attempt number
 * @param maxRetries - Maximum number of retries
 * @param config - Retry configuration
 * @returns Result object indicating success/failure and continuation status
 */
async function executeAttempt<T>(
  operation: () => Promise<T>,
  attempt: number,
  maxRetries: number,
  config: Required<RetryOptions>
): Promise<{ success: true; result: T } | { success: false; error: Error; shouldContinue: boolean }> {
  try {
    const result = await operation()
    return { success: true, result }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    
    if (!isRetryable(err, config.shouldRetry)) {
      return { success: false, error: err, shouldContinue: false }
    }

    if (attempt < maxRetries) {
      const delayMs = calculateDelay(config.baseDelayMs, attempt)
      logRetryAttempt(err, attempt, delayMs)
      await delay(delayMs)
      return { success: false, error: err, shouldContinue: true }
    }

    return { success: false, error: err, shouldContinue: false }
  }
}

/**
 * Wrap an async operation with retry logic and exponential backoff
 * 
 * Retries the operation up to maxRetries times with exponential backoff delay.
 * Retry behavior can be customized with the shouldRetry predicate.
 * 
 * @template T - Return type of the operation
 * @param operation - Async function to execute with retry logic
 * @param options - Optional retry configuration
 * @param options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param options.baseDelayMs - Base delay for exponential backoff (default: 2000ms)
 * @param options.shouldRetry - Predicate to determine if error is retryable (default: always retry)
 * @returns Result of operation or null if all retries exhausted
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => fetch('https://api.example.com/data'),
 *   {
 *     maxRetries: 3,
 *     shouldRetry: (error) => !error.message.includes('401')
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T | null> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    const result = await executeAttempt(operation, attempt, config.maxRetries, config)
    
    if (result.success) {
      return result.result
    }

    lastError = result.error
    
    if (!result.shouldContinue) {
      break
    }
  }

  logger.error('Operation failed after all retry attempts', {
    error: lastError?.message,
    maxRetries: config.maxRetries,
  })

  return null
}
