import blockContent from './blockContent'

// Document schemas
import category from './documents/category'
import video from './documents/video'
import user from './documents/user'
import adPlacement from './documents/adPlacement'
import affiliatePartner from './documents/affiliatePartner'
import activityLog from './documents/activityLog'

// Object schemas
import youtubeEmbed from './objects/youtubeEmbed'
import categoryPath from './objects/categoryPath'
import adContent from './objects/adContent'
import logMetadata from './objects/logMetadata'

export const schemaTypes = [
  // Document types
  category,
  video,
  user,
  adPlacement,
  affiliatePartner,
  activityLog,

  // Object types
  youtubeEmbed,
  categoryPath,
  adContent,
  logMetadata,

  // Other types
  blockContent,
]
