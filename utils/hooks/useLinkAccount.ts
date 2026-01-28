/**
 * useLinkAccount Hook
 * Manages state and logic for linking Telegram accounts
 */

import { useState, useEffect, useCallback } from 'react'

export interface LinkParams {
  telegramId: string | null
  telegramUsername: string | null
  telegramName: string | null
  groupId: string | null
  role: string
}

export interface LinkedUser {
  id: string
  name?: string
  email: string
  role?: string
  telegramUsername?: string
}

export interface CurrentUser {
  id: string
  email: string
  name?: string
}

export type LinkAccountState =
  | 'loading'
  | 'already-linked'
  | 'not-logged-in'
  | 'ready-to-link'
  | 'linking'
  | 'success'

export interface UseLinkAccountResult {
  state: LinkAccountState
  linkedUser: LinkedUser | null
  currentUser: CurrentUser | null
  error: string | null
  handleLinkAccount: () => Promise<void>
}

export function useLinkAccount(params: LinkParams): UseLinkAccountResult {
  const [state, setState] = useState<LinkAccountState>('loading')
  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    setState('loading')

    try {
      // Check if this Telegram ID is already linked
      if (params.telegramId) {
        const linkCheckRes = await fetch(`/api/users/check-telegram?tg=${params.telegramId}`)
        const linkCheckData = await linkCheckRes.json()

        if (linkCheckData.linked) {
          setLinkedUser(linkCheckData.user)
          setState('already-linked')
          return
        }
      }

      // Check if current session is logged in
      const res = await fetch('/api/users/me', { credentials: 'include' })

      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setCurrentUser(data.user)
          setState('ready-to-link')
          return
        }
      }

      setState('not-logged-in')
    } catch (err) {
      console.error('checkStatus error:', err)
      setState('not-logged-in')
    }
  }, [params.telegramId])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  async function handleLinkAccount() {
    if (!params.telegramId) {
      setError('Missing Telegram ID. Please try the link from Telegram again.')
      return
    }

    setState('linking')
    setError(null)

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
        throw new Error(data.message || 'Failed to link account')
      }

      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setState('ready-to-link')
    }
  }

  return {
    state,
    linkedUser,
    currentUser,
    error,
    handleLinkAccount,
  }
}
