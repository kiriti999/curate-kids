/**
 * Link Account View Selector
 * Determines which view to show based on authentication state
 */

import { AuthenticatedView } from './AuthenticatedView'
import { LoginPrompt } from './LoginPrompt'


interface ViewSelectorProps {
  isLoggedIn: boolean
  success: boolean
  user: any
  telegramId?: string
  telegramUsername?: string
  telegramName?: string
  searchParams: URLSearchParams
  role: string
  error: string | null
  isLoading: boolean
  handleLinkAccount: () => void
}

export function LinkAccountViewSelector({
  isLoggedIn,
  success,
  user,
  telegramId,
  telegramUsername,
  telegramName,
  searchParams,
  role,
  error,
  isLoading,
  handleLinkAccount,
}: ViewSelectorProps) {
  const isOwner = role === 'admin'
  const displayRole = isOwner ? 'Admin (Group Owner)' : 'Contributor'

  if (!isLoggedIn) {
    return (
      <LoginPrompt
        telegramUsername={telegramUsername}
        telegramName={telegramName}
        searchParams={searchParams}
        isOwner={isOwner}
      />
    )
  }

  return (
    <AuthenticatedView
      success={success}
      user={user}
      telegramId={telegramId}
      telegramUsername={telegramUsername}
      telegramName={telegramName}
      displayRole={displayRole}
      isOwner={isOwner}
      error={error}
      isLoading={isLoading}
      handleLinkAccount={handleLinkAccount}
    />
  )
}
