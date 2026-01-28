/**
 * Already Linked State Component
 * Shows when the Telegram account is already connected to a user
 */

interface AlreadyLinkedProps {
    linkedUser: {
        name?: string
        email: string
        role?: string
        telegramUsername?: string
    }
}

export function AlreadyLinkedState({ linkedUser }: AlreadyLinkedProps) {
    return (
        <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
                Already Linked!
            </h1>
            <p className="text-white/70 mb-6">
                This Telegram account is already connected to your CuratedReels account.
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Connected Account</p>
                <p className="text-white font-medium">{linkedUser.name || linkedUser.email}</p>
                {linkedUser.telegramUsername && (
                    <p className="text-white/60 text-sm">@{linkedUser.telegramUsername}</p>
                )}
                <p className="text-emerald-400 text-sm mt-2 capitalize">{linkedUser.role}</p>
            </div>

            <a
                href="/admin"
                className="w-full inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all text-center"
            >
                Go to Admin Panel
            </a>

            <p className="text-white/50 text-sm mt-4">
                You can close this window and return to Telegram.
            </p>
        </div>
    )
}
