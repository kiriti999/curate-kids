/**
 * Authenticated View Component
 * Displays link confirmation or success based on state
 */

import { SuccessState } from './SuccessState'
import { LinkConfirmation } from './LinkConfirmation'

interface AuthenticatedViewProps {
  success: boolean
  user: any
  telegramId?: string
  telegramUsername?: string
  telegramName?: string
  displayRole: string
  isOwner: boolean
  error: string | null
  isLoading: boolean
  handleLinkAccount: () => void
}

export function AuthenticatedView({
  success,
  user,
  telegramId,
  telegramUsername,
  telegramName,
  displayRole,
  isOwner,
  error,
  isLoading,
  handleLinkAccount,
}: AuthenticatedViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        {success ? (
          <SuccessState />
        ) : (
          <LinkConfirmation
            user={user}
            telegramId={telegramId}
            telegramUsername={telegramUsername}
            telegramName={telegramName}
            displayRole={displayRole}
            isOwner={isOwner}
            error={error}
            isLoading={isLoading}
            onLinkAccount={handleLinkAccount}
          />
        )}
      </div>
    </div>
  )
}
