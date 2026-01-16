/**
 * Category button configuration for inline keyboard
 * 
 * Defines the 8 category options with emoji and values
 */

import { VideoCategory } from '../types/VideoSubmission';

export interface CategoryButton {
  text: string;                // Display text with emoji
  value: VideoCategory;        // Callback data value
}

export const categoryButtons: CategoryButton[] = [
  { text: '📚 Education', value: 'education' },
  { text: '🎭 Entertainment', value: 'entertainment' },
  { text: '🎵 Music', value: 'music' },
  { text: '🔬 Science', value: 'science' },
  { text: '🎨 Arts & Crafts', value: 'arts-crafts' },
  { text: '⚽ Sports', value: 'sports' },
  { text: '🌳 Nature', value: 'nature' },
  { text: '📖 Stories', value: 'stories' },
];
