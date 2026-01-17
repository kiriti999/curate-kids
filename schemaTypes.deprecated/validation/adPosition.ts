// Ad position validation utility
// Validates that ad placement position is valid and inline ads have proper configuration

export function validateAdPosition(position: string, inlinePosition?: any): true | string {
  const validPositions = ['header', 'footer', 'sidebar', 'inline', 'floating']
  
  if (!validPositions.includes(position)) {
    return `Invalid position. Must be one of: ${validPositions.join(', ')}`
  }
  
  // Inline ads require configuration
  if (position === 'inline') {
    if (!inlinePosition) {
      return 'Inline ads require position configuration (everyNVideos)'
    }
    
    if (!inlinePosition.everyNVideos || inlinePosition.everyNVideos < 1) {
      return 'everyNVideos must be at least 1'
    }
    
    if (inlinePosition.offsetStart !== undefined && inlinePosition.offsetStart < 0) {
      return 'offsetStart must be 0 or greater'
    }
  }
  
  return true
}

// Priority validation (1-100 range)
export function validatePriority(priority: number): true | string {
  if (priority < 1 || priority > 100) {
    return 'Priority must be between 1 and 100'
  }
  
  return true
}

// Validate date range (endDate must be after startDate)
export function validateDateRange(startDate?: string, endDate?: string): true | string {
  if (!startDate || !endDate) {
    return true
  }
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (end <= start) {
    return 'End date must be after start date'
  }
  
  return true
}
