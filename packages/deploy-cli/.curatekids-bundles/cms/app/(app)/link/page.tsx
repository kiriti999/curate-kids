'use client'

/**
 * Link Telegram Account Page
 * 
 * Users are redirected here from Telegram bot to link their account.
 * URL params: ?tg=telegramId&group=groupId&role=admin|contributor&username=xxx&name=xxx
 */

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LinkAccountViewSelector } from '../../../components/link-account/ViewSelector'
import { useLinkAccount } from '../../../utils/hooks/useLinkAccount'

function LinkAccountContent() {
  const searchParams = useSearchParams()

  const telegramId = searchParams.get('tg')
  const groupId = searchParams.get('group')
  const role = searchParams.get('role') || 'contributor'
  const telegramUsername = searchParams.get('username')
  const telegramName = searchParams.get('name')

  const linkState = useLinkAccount({
    telegramId,
    telegramUsername,
    telegramName,
    groupId,
    role,
  })

  return (
    <LinkAccountViewSelector
      isLoggedIn={linkState.isLoggedIn}
      success={linkState.success}
      user={linkState.user}
      telegramId={telegramId || undefined}
      telegramUsername={telegramUsername || undefined}
      telegramName={telegramName || undefined}
      searchParams={searchParams}
      role={role}
      error={linkState.error}
      isLoading={linkState.isLoading}
      handleLinkAccount={linkState.handleLinkAccount}
    />
  )
}

export default function LinkAccountPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
                <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full"></div>
            </div>
        }>
            <LinkAccountContent />
        </Suspense>
    )
}
