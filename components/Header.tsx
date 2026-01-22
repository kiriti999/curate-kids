'use client'

import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

export default function Header() {
    return (
        <header className="bg-background border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                CurateKids
                            </h1>
                            <p className="text-muted-foreground text-sm">Curated videos for young learners</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/business"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all hidden sm:flex items-center"
                        >
                            🚀 Curate for Business
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
