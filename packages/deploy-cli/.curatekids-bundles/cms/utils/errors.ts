/**
 * Error Handling Utilities
 * 
 * Provides standardized error handling utilities for migration and API integration.
 * All error classes extend base Error for proper stack trace capture.
 */

import { logger } from './logger'

/**
 * Base class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly context?: Record<string, any>

  constructor(message: string, statusCode = 500, context?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.context = context
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error thrown when data validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, context)
  }
}

/**
 * Error thrown when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, context)
  }
}

/**
 * Error thrown when external API calls fail
 */
export class ExternalAPIError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 502, context)
  }
}

/**
 * Error thrown when migration operations fail
 */
export class MigrationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, context)
  }
}

/**
 * Error thrown when resources are not found
 */
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 404, context)
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 401, context)
  }
}

/**
 * Error thrown when authorization fails
 */
export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 403, context)
  }
}

/**
 * Handle error with consistent logging and response formatting
 * 
 * @param error - Error to handle
 * @param defaultMessage - Default message if error is not an AppError
 * @returns Formatted error response
 */
export function handleError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): { message: string; statusCode: number; context?: Record<string, any> } {
  if (error instanceof AppError) {
    logger.error(error.message, {
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack,
    })
    return {
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
    }
  }

  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
    })
    return {
      message: error.message,
      statusCode: 500,
    }
  }

  logger.error(defaultMessage, { error })
  return {
    message: defaultMessage,
    statusCode: 500,
  }
}

/**
 * Wrap async function with error handling
 * 
 * @param fn - Async function to wrap
 * @param context - Additional context for error logging
 * @returns Wrapped function with error handling
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error)
      if (context) {
        logger.error('Wrapped function failed', context)
      }
      return null
    }
  }
}

/**
 * Assert that a condition is true, throw ValidationError otherwise
 * 
 * @param condition - Condition to assert
 * @param message - Error message if assertion fails
 * @param context - Additional context for debugging
 */
export function assert(
  condition: boolean,
  message: string,
  context?: Record<string, any>
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, context)
  }
}
