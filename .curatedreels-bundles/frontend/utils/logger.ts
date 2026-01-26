/**
 * Logger Utility
 * 
 * Provides structured logging with context for all application code.
 * Replaces console.log/error/warn with structured JSON output.
 */

interface LogContext {
  [key: string]: any
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

/**
 * Format log message as structured JSON
 * 
 * @param level - Log level (info, warn, error, debug)
 * @param message - Human-readable log message
 * @param context - Additional context data to include in log
 * @returns Formatted JSON string for logging
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }
  return JSON.stringify(logEntry)
}

export const logger = {
  /**
   * Log informational message
   * 
   * @param message - Human-readable message
   * @param context - Optional context data
   */
  info(message: string, context?: LogContext): void {
    console.log(formatLog('info', message, context))
  },

  /**
   * Log warning message
   * 
   * @param message - Human-readable warning message
   * @param context - Optional context data
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatLog('warn', message, context))
  },

  /**
   * Log error message
   * 
   * @param message - Human-readable error message
   * @param context - Optional context data (should include error details)
   */
  error(message: string, context?: LogContext): void {
    console.error(formatLog('error', message, context))
  },

  /**
   * Log debug message (only in development)
   * 
   * @param message - Human-readable debug message
   * @param context - Optional context data
   */
  debug(message: string, context?: LogContext): void {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('debug', message, context))
    }
  },
}
