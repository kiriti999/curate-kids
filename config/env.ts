/**
 * Environment Configuration
 * 
 * Validates and exports type-safe environment variables.
 * Fails fast on application startup if required variables are missing.
 */

interface EnvConfig {
  SANITY_PROJECT_ID: string
  SANITY_DATASET: string
  SANITY_TOKEN: string
  NEXT_PUBLIC_SANITY_PROJECT_ID: string
  NEXT_PUBLIC_SANITY_DATASET: string
  // Optional environment variables
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  YOUTUBE_API_KEY?: string
}

/**
 * Validate required environment variables and return typed config
 * 
 * @returns Validated environment configuration
 * @throws Error if required variables are missing
 */
function validateEnv(): EnvConfig {
  const requiredVars = [
    'SANITY_PROJECT_ID',
    'SANITY_DATASET',
    'SANITY_TOKEN',
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
  ]

  const missing: string[] = []

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.\n' +
        'See .env.example for reference.'
    )
  }

  return {
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID!,
    SANITY_DATASET: process.env.SANITY_DATASET!,
    SANITY_TOKEN: process.env.SANITY_TOKEN!,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    // Optional variables
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  }
}

export const env: EnvConfig = validateEnv()
