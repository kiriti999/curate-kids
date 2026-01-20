'use client'

/**
 * Link Telegram Account Page
 * 
 * Users are redirected here from Telegram bot to link their account.
 * URL params: ?tg=telegramId&group=groupId&role=admin|contributor&username=xxx&name=xxx
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function LinkAccountContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState<any>(null)

    // Extract params from URL
    const telegramId = searchParams.get('tg')
    const groupId = searchParams.get('group')
    const role = searchParams.get('role') || 'contributor'
    const telegramUsername = searchParams.get('username')
    const telegramName = searchParams.get('name')

    // Check if user is already logged in
    useEffect(() => {
        checkAuthStatus()
    }, [])

    // Determine display role - admin = owner
    const isOwner = role === 'admin'
    const displayRole = isOwner ? 'Admin (Group Owner)' : 'Contributor'

    async function checkAuthStatus() {
        try {
            const res = await fetch('/api/users/me', {
                credentials: 'include',
            })

            if (res.ok) {
                const data = await res.json()
                if (data.user) {
                    setIsLoggedIn(true)
                    setUser(data.user)

                    // If user already has their telegram linked, show success
                    if (data.user.telegramId === telegramId) {
                        setSuccess(true)
                    }
                }
            }
        } catch {
            // Not logged in
        }
    }

    async function handleLinkAccount() {
        if (!telegramId) {
            setError('Missing Telegram ID. Please try the link from Telegram again.')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Update current user with Telegram info
            const res = await fetch('/api/users/link-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    telegramId,
                    telegramUsername,
                    telegramFirstName: telegramName,
                    groupId,
                    role,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to link account')
            }

            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    // Not logged in - show login options
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 ${isOwner ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
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
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isOwner ? 'Connect Admin Account' : 'Link Your Account'}
                        </h1>
                        <p className="text-white/70">
                            {isOwner
                                ? 'Sign in to link your existing account to this Telegram group'
                                : 'Sign in to connect your Telegram account with CurateKids'
                            }
                        </p>
                    </div>

                    {telegramUsername && (
                        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                            <p className="text-white/60 text-sm mb-1">Telegram Account</p>
                            <p className="text-white font-medium">
                                @{telegramUsername}
                                {telegramName && <span className="text-white/60 ml-2">({telegramName})</span>}
                            </p>
                        </div>
                    )}

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

    // Logged in - show link confirmation
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                {success ? (
                    // Success state
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
                ) : (
                    // Confirmation state
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
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <p className="text-white/60 text-sm mb-1">Telegram Account</p>
                                <p className="text-white font-medium">
                                    {telegramUsername ? `@${telegramUsername}` : `ID: ${telegramId}`}
                                </p>
                                {telegramName && <p className="text-white/60 text-sm">{telegramName}</p>}
                            </div>

                            {/* Role */}
                            <div className={`bg-gradient-to-r ${isOwner ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' : 'from-purple-500/20 to-pink-500/20 border-purple-500/30'} rounded-xl p-4 border`}>
                                <p className="text-white/60 text-sm mb-1">You will be added as</p>
                                <p className="text-white font-semibold">{displayRole}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4">
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleLinkAccount}
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

                        <button
                            onClick={() => router.push('/')}
                            className="w-full mt-3 text-white/60 hover:text-white text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
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
