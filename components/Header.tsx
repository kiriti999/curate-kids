"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <header className="bg-background border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link href={isAuthenticated ? "/content" : "/"} className="hover:opacity-80 transition-opacity">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                CuratedReels
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Curated videos for young learners
                            </p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3">
                        {isAuthenticated && user && (
                            <>
                                <Link
                                    href="/content"
                                    className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <span>📺 My Videos</span>
                                </Link>
                                <Link
                                    href="/parental-controls"
                                    className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <span>🛡️ Safe Browse</span>
                                </Link>
                                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{user.name}</span>
                                </div>
                            </>
                        )}
                        <ThemeToggle />
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
