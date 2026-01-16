/**
 * Structured logging utility
 * 
 * Provides consistent logging format across the bot
 */

export type LogLevel = 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

/**
 * Log information message
 */
export function info(message: string, data?: LogData): void {
  log('info', message, data);
}

/**
 * Log warning message
 */
export function warn(message: string, data?: LogData): void {
  log('warn', message, data);
}

/**
 * Log error message
 */
export function error(message: string, errorData?: Error | LogData): void {
  const data = errorData instanceof Error 
    ? { error: errorData.message, stack: errorData.stack }
    : errorData;
  
  log('error', message, data);
}

/**
 * Internal log function with structured JSON output
 */
function log(level: LogLevel, message: string, data?: LogData): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  
  const output = JSON.stringify(logEntry);
  
  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}
