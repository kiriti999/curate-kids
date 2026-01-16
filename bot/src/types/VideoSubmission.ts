/**
 * VideoSubmission: Data structure sent to Sanity CMS to create video document
 * 
 * Matches existing Sanity video schema
 */

import { AgeRange } from './MessageState';

export type VideoCategory = 
  | 'education' 
  | 'entertainment' 
  | 'music' 
  | 'science' 
  | 'arts-crafts' 
  | 'sports' 
  | 'nature' 
  | 'stories';

export interface VideoSubmission {
  _type: 'video';
  
  // Required fields
  title: string;               // From YouTube API
  slug: {                      // Auto-generated from title
    _type: 'slug';
    current: string;
  };
  youtubeUrl: string;          // From original message
  youtubeId: string;           // Extracted from URL
  category: VideoCategory;     // From curator selection
  ageRange: AgeRange;          // From group mapping
  
  // Optional fields
  tags: string[];              // Empty array initially
}
