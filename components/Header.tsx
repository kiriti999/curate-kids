'use client'

import ThemeToggle from './ThemeToggle'

export default function Header() {
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
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
