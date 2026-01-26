/**
 * AffiliatePartner Collection Hooks
 * 
 * Handles conversion rate calculation.
 */

import { CollectionAfterReadHook } from 'payload'

/**
 * afterRead Hook: Calculate conversion rate
 * 
 * T032: Calculate conversion rate from totalClicks and totalImpressions
 */
export const afterReadAffiliatePartnerHook: CollectionAfterReadHook = async ({
  doc,
  req,
}) => {
  // Calculate conversion rate: (clicks / impressions) * 100
  if (doc.totalImpressions && doc.totalImpressions > 0) {
    doc.conversionRate = ((doc.totalClicks || 0) / doc.totalImpressions) * 100
  } else {
    doc.conversionRate = 0
  }

  return doc
}
