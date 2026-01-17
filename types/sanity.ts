/**
 * Sanity Document Types
 * 
 * TypeScript interfaces for Sanity CMS documents and query results.
 * Provides type safety for all Sanity operations.
 */

import type { Transaction } from '@sanity/client'

/**
 * Base interface for all Sanity documents
 */
export interface SanityDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
}

/**
 * Video document schema
 */
export interface VideoDocument extends SanityDocument {
  _type: 'video'
  title: string
  youtubeUrl?: string
  youtubeId?: string
  category?: string
  ageRange?: string
  tags?: string[]
  description?: string
}

/**
 * Category document schema
 */
export interface CategoryDocument extends SanityDocument {
  _type: 'category'
  title: string
  value: string
  parent?: {
    _ref: string
    _type: 'reference'
  }
}

/**
 * Age range document schema
 */
export interface AgeRangeDocument extends SanityDocument {
  _type: 'ageRange'
  title: string
  value: string
  minAge: number
  maxAge: number
}

/**
 * Typical video query result with selected fields
 */
export interface VideoQueryResult {
  _id: string
  _createdAt: string
  title: string
  youtubeId: string
  youtubeUrl?: string
  category?: string
  ageRange?: string
  tags?: string[]
  description?: string
}

/**
 * Typical category query result
 */
export interface CategoryQueryResult {
  _id: string
  title: string
  value: string
  parent?: {
    _ref: string
  }
}

/**
 * Typical age range query result
 */
export interface AgeRangeQueryResult {
  _id: string
  title: string
  value: string
  minAge: number
  maxAge: number
}

/**
 * Sanity mutation result
 */
export interface MutationResult<T = SanityDocument> {
  transactionId: string
  results: T[]
  documentIds: string[]
}

/**
 * Document creation input
 */
export interface CreateDocumentInput {
  _type: string
  [key: string]: unknown
}

/**
 * Sanity API response wrapper
 */
export interface SanityResponse<T> {
  ms: number
  query: string
  result: T
}

/**
 * Re-export Transaction type from @sanity/client
 */
export type { Transaction }
