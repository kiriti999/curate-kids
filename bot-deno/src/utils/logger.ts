/**
 * Simple logger utility
 */

export function info(message: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    message,
    ...data,
  }));
}

export function warn(message: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "warn",
    message,
    ...data,
  }));
}

export function error(message: string, data?: Record<string, unknown> | Error): void {
  const errorData = data instanceof Error
    ? { error: data.message, stack: data.stack }
    : data;
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    message,
    ...errorData,
  }));
}
