'use client'

import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { useAuth } from './AuthProvider'
import { Button } from './ui/button'
import Logo from './Logo'


export default function Header() {
    const { user, isAuthenticated, logout, requireLogin } = useAuth()

    return (
        <header className="bg-background border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <Logo />
                    </Link>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/business"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all hidden sm:flex items-center"
                        >
                            🚀 Curate for Business
                        </Link>
                        {isAuthenticated && user && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium hidden sm:block">{user.name}</span>
                                <Button variant="outline" size="sm" onClick={logout}>
                                    Logout
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
