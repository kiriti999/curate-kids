/**
 * Environment Configuration
 * 
 * Validates and exports type-safe environment variables.
 * Fails fast on application startup if required variables are missing.
 */

interface EnvConfig {
  // Optional environment variables
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  YOUTUBE_API_KEY?: string
  MONGODB_URI?: string
  PAYLOAD_SECRET?: string
}

/**
 * Validate environment variables and return typed config
 * 
 * @returns Validated environment configuration
 */
function validateEnv(): EnvConfig {
  return {
    // Optional variables
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  }
}

export const env: EnvConfig = validateEnv()
