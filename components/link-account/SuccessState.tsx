/**
 * Success State Component
 * Displays success message after account linking
 */

export function SuccessState() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">
        Account Linked!
      </h1>
      <p className="text-white/70 mb-6">
        Your Telegram account is now connected. You can return to Telegram and start submitting videos.
      </p>
      <p className="text-white/50 text-sm">
        You can close this window now.
      </p>
    </div>
  )
}
