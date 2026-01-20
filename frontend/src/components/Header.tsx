'use client'

import ThemeToggle from './ThemeToggle'
import { useAuth } from './AuthProvider'
import { Button } from './ui/button'

export default function Header() {
    const { user, isAuthenticated, logout, requireLogin } = useAuth()

    return (
        <header className="bg-background border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">
                            CurateKids
                        </h1>
                        <p className="text-muted-foreground">Curated videos for young learners</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        {requireLogin && isAuthenticated && user && (
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
