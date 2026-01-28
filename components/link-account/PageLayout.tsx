/**
 * Link Account Page Layout Wrapper
 * Common layout for all link account states
 */

import { ReactNode } from 'react'

interface PageLayoutProps {
    children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                {children}
            </div>
        </div>
    )
}
