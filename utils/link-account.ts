/**
 * Link Account Utilities
 * Helper functions for link account page
 */

export interface LinkAccountState {
  isLoading: boolean
  error: string | null
  success: boolean
  isLoggedIn: boolean
  user: any
}

/**
 * Check if user is authenticated
 */
export async function checkAuthStatus(): Promise<{ user: any | null; isLoggedIn: boolean }> {
  try {
    const res = await fetch('/api/users/me', {
      credentials: 'include',
    })

    if (res.ok) {
      const data = await res.json()
      if (data.user) {
        return { user: data.user, isLoggedIn: true }
      }
    }
  } catch {
    // Not logged in
  }

  return { user: null, isLoggedIn: false }
}

/**
 * Check if user's Telegram is already linked
 */
export function isTelegramAlreadyLinked(user: any, telegramId: string | null): boolean {
  return !!user && !!telegramId && user.telegramId === telegramId
}

/**
 * Link Telegram account to current user
 */
export async function linkTelegramAccount(params: {
  telegramId: string
  telegramUsername?: string
  telegramName?: string
  groupId?: string
  role?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users/link-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        telegramId: params.telegramId,
        telegramUsername: params.telegramUsername,
        telegramFirstName: params.telegramName,
        groupId: params.groupId,
        role: params.role,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.message || 'Failed to link account' }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred',
    }
  }
}

/**
 * Validate required parameters
 */
export function validateLinkParams(telegramId: string | null): { valid: boolean; error?: string } {
  if (!telegramId) {
    return {
      valid: false,
      error: 'Missing Telegram ID. Please try the link from Telegram again.',
    }
  }

  return { valid: true }
}
