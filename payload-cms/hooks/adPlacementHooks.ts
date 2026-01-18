/**
 * AdPlacement Collection Hooks
 * 
 * Handles inline position validation, date validation, and CTR calculation.
 */

import { CollectionBeforeValidateHook, CollectionAfterReadHook } from 'payload'

/**
 * beforeValidate Hook: Validate inline position and date range
 * 
 * T028: Validate inline position when required, startDate < endDate
 */
export const beforeValidateAdPlacementHook: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Validate inline position is set when position is 'inline'
  if (data?.position === 'inline' && !data?.inlinePosition) {
    throw new Error('Inline position is required when placement position is "inline"')
  }

  // Validate startDate < endDate
  if (data?.startDate && data?.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    
    if (start >= end) {
      throw new Error('Start date must be before end date')
    }
  }

  return data
}

/**
 * afterRead Hook: Calculate CTR from clicks/impressions
 * 
 * T029: Calculate CTR (click-through rate) from impressionCount and clickCount
 */
export const afterReadAdPlacementHook: CollectionAfterReadHook = async ({
  doc,
  req,
}) => {
  // Calculate CTR: (clicks / impressions) * 100
  if (doc.impressionCount && doc.impressionCount > 0) {
    doc.ctr = ((doc.clickCount || 0) / doc.impressionCount) * 100
  } else {
    doc.ctr = 0
  }

  return doc
}
