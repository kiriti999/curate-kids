/**
 * Link Confirmation Component
 * Displays account linking confirmation UI
 */

import { useRouter } from 'next/navigation'

interface LinkConfirmationProps {
  user: any
  telegramId?: string
  telegramUsername?: string
  telegramName?: string
  displayRole: string
  isOwner: boolean
  error: string | null
  isLoading: boolean
  onLinkAccount: () => void
}

function LinkButton({ isLoading, onLinkAccount }: { isLoading: boolean; onLinkAccount: () => void }) {
  return (
    <button
      onClick={onLinkAccount}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Linking...
        </span>
      ) : (
        'Link Accounts'
      )}
    </button>
  )
}

function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null

  return (
    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
      <p className="text-red-200 text-sm">{error}</p>
    </div>
  )
}

function TelegramDisplay({ telegramId, telegramUsername, telegramName }: { 
  telegramId?: string
  telegramUsername?: string
  telegramName?: string
}) {
  const displayId = telegramUsername ? `@${telegramUsername}` : `ID: ${telegramId}`

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <p className="text-white/60 text-sm mb-1">Telegram Account</p>
      <p className="text-white font-medium">{displayId}</p>
      {telegramName && <p className="text-white/60 text-sm">{telegramName}</p>}
    </div>
  )
}

export function LinkConfirmation({
  user,
  telegramId,
  telegramUsername,
  telegramName,
  displayRole,
  isOwner,
  error,
  isLoading,
  onLinkAccount,
}: LinkConfirmationProps) {
  const router = useRouter()
  const roleClass = isOwner
    ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
    : 'from-purple-500/20 to-pink-500/20 border-purple-500/30'

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Link Accounts
        </h1>
        <p className="text-white/70">
          Connect your Telegram to your CurateKids account
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* CMS Account */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/60 text-sm mb-1">CurateKids Account</p>
          <p className="text-white font-medium">{user?.email}</p>
          <p className="text-white/60 text-sm">{user?.name}</p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Telegram Account */}
        <TelegramDisplay
          telegramId={telegramId}
          telegramUsername={telegramUsername}
          telegramName={telegramName}
        />

        {/* Role */}
        <div className={`bg-gradient-to-r ${roleClass} rounded-xl p-4 border`}>
          <p className="text-white/60 text-sm mb-1">You will be added as</p>
          <p className="text-white font-semibold">{displayRole}</p>
        </div>
      </div>

      <ErrorMessage error={error} />

      <LinkButton isLoading={isLoading} onLinkAccount={onLinkAccount} />

      <button
        onClick={() => router.push('/')}
        className="w-full mt-3 text-white/60 hover:text-white text-sm transition-colors"
      >
        Cancel
      </button>
    </>
  )
}
