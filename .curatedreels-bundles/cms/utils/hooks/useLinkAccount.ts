/**
 * useLinkAccount Hook
 * Manages state and logic for linking Telegram accounts
 */

import { useState, useEffect } from 'react'
import {
  checkAuthStatus,
  isTelegramAlreadyLinked,
  linkTelegramAccount,
  validateLinkParams,
} from '../link-account'

export interface UseLinkAccountParams {
  telegramId: string | null
  telegramUsername: string | null
  telegramName: string | null
  groupId: string | null
  role: string
}

export function useLinkAccount(params: UseLinkAccountParams) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadAuthStatus()
  }, [])

  async function loadAuthStatus() {
    const { user: currentUser, isLoggedIn: loggedIn } = await checkAuthStatus()
    setIsLoggedIn(loggedIn)
    setUser(currentUser)

    if (isTelegramAlreadyLinked(currentUser, params.telegramId)) {
      setSuccess(true)
    }
  }

  async function handleLinkAccount() {
    const validation = validateLinkParams(params.telegramId)
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid parameters')
      return
    }

    await performLinkAccount()
  }

  async function performLinkAccount() {
    setIsLoading(true)
    setError(null)

    const result = await linkTelegramAccount({
      telegramId: params.telegramId!,
      telegramUsername: params.telegramUsername || undefined,
      telegramName: params.telegramName || undefined,
      groupId: params.groupId || undefined,
      role: params.role,
    })

    updateLinkResult(result)
  }

  function updateLinkResult(result: { success: boolean; error?: string }) {
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Failed to link account')
    }
    setIsLoading(false)
  }

  return {
    isLoading,
    error,
    success,
    isLoggedIn,
    user,
    handleLinkAccount,
  }
}
