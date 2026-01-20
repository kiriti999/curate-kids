/**
 * Login Prompt Component
 * Displays login screen for unauthenticated users
 */

interface LoginPromptProps {
  telegramUsername?: string
  telegramName?: string
  searchParams: URLSearchParams
  isOwner: boolean
}

function RoleIcon({ isOwner }: { isOwner: boolean }) {
  const bgClass = isOwner
    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
    : 'bg-gradient-to-br from-blue-400 to-purple-500'

  return (
    <div className={`w-20 h-20 ${bgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
      {isOwner ? (
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      ) : (
        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      )}
    </div>
  )
}

function TelegramInfo({ username, name }: { username?: string; name?: string }) {
  if (!username) return null

  return (
    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
      <p className="text-white/60 text-sm mb-1">Telegram Account</p>
      <p className="text-white font-medium">
        @{username}
        {name && <span className="text-white/60 ml-2">({name})</span>}
      </p>
    </div>
  )
}

export function LoginPrompt({ telegramUsername, telegramName, searchParams, isOwner }: LoginPromptProps) {
  const title = isOwner ? 'Connect Admin Account' : 'Link Your Account'
  const description = isOwner
    ? 'Sign in to link your existing account to this Telegram group'
    : 'Sign in to connect your Telegram account with CurateKids'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <RoleIcon isOwner={isOwner} />
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          <p className="text-white/70">{description}</p>
        </div>

        <TelegramInfo username={telegramUsername} name={telegramName} />

        <div className="space-y-4">
          <a
            href={`/admin/login?redirect=${encodeURIComponent(`/link?${searchParams.toString()}`)}`}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Log in to Link Account
          </a>
        </div>

        <p className="text-white/50 text-sm text-center mt-6">
          By continuing, you agree to link your Telegram account with your CurateKids account.
        </p>
      </div>
    </div>
  )
}
