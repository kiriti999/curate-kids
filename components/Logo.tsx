import React from 'react';

interface LogoProps {
    className?: string;
    showTagline?: boolean;
}

export default function Logo({ className = "", showTagline = true }: LogoProps) {
    return (
        <div className={`flex flex-col ${className}`}>
            <span className="text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                CuratedReels
            </span>
            {showTagline && (
                <span className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                    Curated videos for young learners
                </span>
            )}
        </div>
    );
}
