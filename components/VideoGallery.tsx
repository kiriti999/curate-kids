"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CategoryManager = dynamic(() => import("@/components/CategoryManager"), {
    ssr: false,
});

// ─── YouTube IFrame Player API Types ───────────────────────────────────────
interface YTPlayerConfig {
    videoId: string;
    host?: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, number | string>;
    events?: { onStateChange?: (event: YTPlayerEvent) => void };
}

interface YTPlayer {
    destroy: () => void;
    playVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    getPlayerState: () => number;
}

interface YTPlayerEvent {
    data: number;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady?: () => void;
        YT?: { Player: new (id: string, config: YTPlayerConfig) => YTPlayer };
    }
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;

/** Load YouTube IFrame API script (singleton) */
let ytApiReady: Promise<void> | null = null;

function loadYouTubeIframeAPI(): Promise<void> {
    if (ytApiReady) return ytApiReady;
    ytApiReady = new Promise<void>((resolve) => {
        if (window.YT?.Player) {
            resolve();
            return;
        }
        window.onYouTubeIframeAPIReady = () => resolve();
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
    });
    return ytApiReady;
}

/**
 * Check if a string is a valid YouTube video ID (11 alphanumeric characters)
 */
function isValidYoutubeId(id: string | undefined | null): boolean {
    if (!id) return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

// PayloadCMS Video interface
interface Video {
    id: string;
    title: string;
    youtubeId?: string | null;
    youtubeUrl: string;
    category: string;
    ageRange: string;
    tags?: Array<{ tag: string; id?: string | null }> | string[] | null;
    createdAt?: string;
}

// Normalized video with string[] tags
interface NormalizedVideo {
    id: string;
    title: string;
    youtubeId: string;
    youtubeUrl: string;
    category: string;
    ageRange: string;
    tags: string[];
    createdAt?: string;
}

// Normalize video data for consistent rendering
function normalizeVideo(video: Video): NormalizedVideo {
    return {
        id: video.id,
        title: video.title,
        youtubeId: video.youtubeId || "",
        youtubeUrl: video.youtubeUrl,
        category: video.category,
        ageRange: video.ageRange,
        createdAt: video.createdAt,
        tags: Array.isArray(video.tags)
            ? video.tags.map((tag) => (typeof tag === "string" ? tag : tag.tag))
            : [],
    };
}

interface VideoGalleryProps {
    videos: Video[];
}

// Hardcoded fallback categories (used while API categories load or if collection is empty)
const FALLBACK_CATEGORIES = [
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
    { value: "music", label: "Music" },
    { value: "science", label: "Science" },
    { value: "arts-crafts", label: "Arts & Crafts" },
    { value: "sports", label: "Sports" },
    { value: "nature", label: "Nature" },
    { value: "stories", label: "Stories" },
];

// Fetch categories from the Payload CMS categories collection via API
function useFetchCategories() {
    const [categories, setCategories] =
        useState<{ value: string; label: string }[]>(FALLBACK_CATEGORIES);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function fetchCategories() {
            try {
                const res = await fetch("/api/frontend-categories");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (!cancelled && data.categories && data.categories.length > 0) {
                    setCategories(
                        data.categories.map((c: any) => ({
                            value: c.value,
                            label: c.label,
                        })),
                    );
                }
            } catch (err) {
                console.error("Failed to fetch categories, using fallback:", err);
                // Keep fallback categories
            } finally {
                if (!cancelled) setLoaded(true);
            }
        }
        fetchCategories();
        return () => {
            cancelled = true;
        };
    }, []);

    return { categories, loaded };
}

const AGE_RANGES = [
    { value: "1-2", label: "1-2 years" },
    { value: "2-3", label: "2-3 years" },
    { value: "3-4", label: "3-4 years" },
    { value: "4-5", label: "4-5 years" },
    { value: "5-8", label: "5-8 years" },
    { value: "9-12", label: "9-12 years" },
    { value: "12-15", label: "12-15 years" },
    { value: "16-18", label: "16-18 years" },
    { value: "18+", label: "18+ years" },
];

function VideoThumbnail({
    video,
    isTheatre,
    showVideo,
    onPlay,
    onToggleTheatre,
}: {
    video: NormalizedVideo;
    isTheatre: boolean;
    showVideo: boolean;
    onPlay: () => void;
    onToggleTheatre: () => void;
}) {
    const [isPausedOrEnded, setIsPausedOrEnded] = useState(false);
    const playerRef = useRef<YTPlayer | null>(null);
    const playerElId = useRef(
        `yt-${video.id}-${Math.random().toString(36).slice(2, 8)}`,
    ).current;
    const hasValidYoutubeId = isValidYoutubeId(video.youtubeId);

    // Create YouTube player via IFrame API to intercept pause/end events
    useEffect(() => {
        if (!showVideo || !hasValidYoutubeId) return;

        let cancelled = false;

        loadYouTubeIframeAPI().then(() => {
            if (cancelled || !document.getElementById(playerElId)) return;

            const player = new window.YT!.Player(playerElId, {
                host: "https://www.youtube-nocookie.com",
                width: "100%",
                height: "100%",
                videoId: video.youtubeId,
                playerVars: {
                    autoplay: 1,
                    fs: 1,
                    rel: 0,
                    loop: 1,
                    playlist: video.youtubeId,
                },
                events: {
                    onStateChange: (e: YTPlayerEvent) => {
                        if (cancelled) return;
                        if (e.data === YT_PAUSED || e.data === YT_ENDED) {
                            setIsPausedOrEnded(true);
                        } else if (e.data === YT_PLAYING) {
                            setIsPausedOrEnded(false);
                        }
                    },
                },
            });
            playerRef.current = player;
        });

        return () => {
            cancelled = true;
            playerRef.current?.destroy();
            playerRef.current = null;
        };
    }, [showVideo, video.youtubeId, hasValidYoutubeId, playerElId]);

    const handleResume = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;
        try {
            if (player.getPlayerState() === YT_ENDED) {
                player.seekTo(0, true);
            }
            player.playVideo();
        } catch {
            /* player may not be ready */
        }
        setIsPausedOrEnded(false);
    }, []);

    if (showVideo && hasValidYoutubeId) {
        return (
            <div className="relative w-full h-full overflow-hidden">
                <div id={playerElId} className="w-full h-full" />

                {/* Overlay covers related videos suggestions on pause/end but leaves YouTube controls bar visible */}
                {isPausedOrEnded && (
                    <button
                        type="button"
                        onClick={handleResume}
                        className="absolute inset-0 bottom-12 z-[2] bg-black/60 flex items-center justify-center border-0 cursor-pointer"
                        aria-label="Resume video"
                    >
                        <svg
                            className="w-16 h-16 text-white/90 drop-shadow-lg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onToggleTheatre}
                    className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded transition-colors"
                    aria-label={isTheatre ? "Exit theatre mode" : "Theatre mode"}
                    title={isTheatre ? "Exit theatre mode" : "Theatre mode"}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                    >
                        {isTheatre ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                            />
                        )}
                    </svg>
                </button>
            </div>
        );
    }

    // Show placeholder for non-YouTube videos
    if (!hasValidYoutubeId) {
        return (
            <div className="relative w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center p-4">
                    <svg
                        className="w-12 h-12 mx-auto text-muted-foreground mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="text-sm text-muted-foreground">External video</p>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={onPlay}
            className="relative w-full h-full group"
            aria-label={`Play ${video.title}`}
        >
            <Image
                src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                alt={video.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg
                        className="w-8 h-8 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        </button>
    );
}

// Filter helper functions
function matchesCategoryFilter(
    video: NormalizedVideo,
    selectedCategories: string[],
): boolean {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.includes(video.category);
}

function matchesAgeRangeFilter(
    video: NormalizedVideo,
    selectedAgeRanges: string[],
): boolean {
    if (selectedAgeRanges.length === 0) return true;
    return selectedAgeRanges.includes(video.ageRange);
}

function matchesSearchQuery(
    video: NormalizedVideo,
    searchQuery: string,
): boolean {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = video.title.toLowerCase().includes(query);
    const matchesTags = video.tags?.some((tag) =>
        tag.toLowerCase().includes(query),
    );
    return matchesTitle || matchesTags;
}

function filterVideos(
    videos: NormalizedVideo[],
    selectedCategories: string[],
    selectedAgeRanges: string[],
    searchQuery: string,
): NormalizedVideo[] {
    return videos.filter(
        (video) =>
            matchesCategoryFilter(video, selectedCategories) &&
            matchesAgeRangeFilter(video, selectedAgeRanges) &&
            matchesSearchQuery(video, searchQuery),
    );
}

// Sidebar filter button component
function FilterButton({
    label,
    count,
    isSelected,
    onClick,
    colorClass,
}: {
    label: string;
    count: number;
    isSelected: boolean;
    onClick: () => void;
    colorClass: string;
}) {
    const isEmpty = count === 0;
    const bgClass = isSelected ? colorClass : "hover:bg-muted text-foreground";
    const badgeClass = isSelected
        ? `${colorClass.replace("600", "500")} text-white`
        : "bg-muted text-muted-foreground";

    return (
        <button
            onClick={isEmpty ? undefined : onClick}
            disabled={isEmpty}
            className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                isEmpty
                    ? "opacity-60 cursor-not-allowed text-muted-foreground"
                    : isSelected
                        ? `${colorClass} text-white`
                        : bgClass,
            )}
        >
            <span>{label}</span>
            <span
                className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    isEmpty ? "bg-muted text-muted-foreground" : badgeClass,
                )}
            >
                {count}
            </span>
        </button>
    );
}

// Sidebar component
function Sidebar({
    searchQuery,
    setSearchQuery,
    categories,
    categoryCounts,
    ageRangeCounts,
    selectedCategories,
    selectedAgeRanges,
    toggleCategory,
    toggleAgeRange,
    hasActiveFilters,
    clearAllFilters,
    onManageCategories,
    isAdmin,
}: {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    categories: { value: string; label: string }[];
    categoryCounts: Record<string, number>;
    ageRangeCounts: Record<string, number>;
    selectedCategories: string[];
    selectedAgeRanges: string[];
    toggleCategory: (c: string) => void;
    toggleAgeRange: (a: string) => void;
    hasActiveFilters: boolean;
    clearAllFilters: () => void;
    onManageCategories?: () => void;
    isAdmin: boolean;
}) {
    return (
        <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-4 space-y-6">
                <Input
                    type="text"
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                    }
                    className="w-full"
                />

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Categories
                        </h3>
                        {isAdmin && onManageCategories && (
                            <button
                                onClick={onManageCategories}
                                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                title="Manage categories"
                                aria-label="Manage categories"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="space-y-1">
                        {categories.map((category) => (
                            <FilterButton
                                key={category.value}
                                label={category.label}
                                count={categoryCounts[category.value] || 0}
                                isSelected={selectedCategories.includes(category.value)}
                                onClick={() => toggleCategory(category.value)}
                                colorClass="bg-violet-600"
                            />
                        ))}
                        {categories.length === 0 && (
                            <p className="text-xs text-muted-foreground italic py-2">
                                No categories yet
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                        Age Range
                    </h3>
                    <div className="space-y-1">
                        {AGE_RANGES.map((ageRange) => (
                            <FilterButton
                                key={ageRange.value}
                                label={ageRange.label}
                                count={ageRangeCounts[ageRange.value] || 0}
                                isSelected={selectedAgeRanges.includes(ageRange.value)}
                                onClick={() => toggleAgeRange(ageRange.value)}
                                colorClass="bg-blue-600"
                            />
                        ))}
                    </div>
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="w-full"
                    >
                        Clear all filters
                    </Button>
                )}
            </div>
        </aside>
    );
}

// Mobile filters component
function MobileFilters({
    searchQuery,
    setSearchQuery,
    categories,
    selectedCategories,
    toggleCategory,
}: {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    categories: { value: string; label: string }[];
    selectedCategories: string[];
    toggleCategory: (c: string) => void;
}) {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-50">
            <div className="flex gap-2 overflow-x-auto pb-1">
                <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                    }
                    className="w-32 flex-shrink-0"
                />
                {categories.slice(0, 4).map((category) => (
                    <button
                        key={category.value}
                        onClick={() => toggleCategory(category.value)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                            selectedCategories.includes(category.value)
                                ? "bg-violet-600 text-white"
                                : "bg-muted text-muted-foreground",
                        )}
                    >
                        {category.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Calculate counts helper
function calculateCounts(
    videos: NormalizedVideo[],
    key: "category" | "ageRange",
): Record<string, number> {
    const counts: Record<string, number> = {};
    videos.forEach((v) => {
        counts[v[key]] = (counts[v[key]] || 0) + 1;
    });
    return counts;
}

// Empty state component
function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
    const message = hasActiveFilters
        ? "No videos match your filters. Try adjusting your selection."
        : "No videos published yet. Add videos via the admin panel!";

    return (
        <Card>
            <CardContent className="p-16 text-center">
                <p className="text-xl text-muted-foreground">{message}</p>
            </CardContent>
        </Card>
    );
}

// Results header component
function ResultsHeader({
    count,
    hasActiveFilters,
}: {
    count: number;
    hasActiveFilters: boolean;
}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
                {count} video{count !== 1 ? "s" : ""}
                {hasActiveFilters && " (filtered)"}
            </p>
        </div>
    );
}

// Custom hook for filter state
function useFilterState() {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category],
        );
    };

    const toggleAgeRange = (ageRange: string) => {
        setSelectedAgeRanges((prev) =>
            prev.includes(ageRange)
                ? prev.filter((a) => a !== ageRange)
                : [...prev, ageRange],
        );
    };

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedAgeRanges([]);
        setSearchQuery("");
    };

    const hasActiveFilters =
        selectedCategories.length > 0 ||
        selectedAgeRanges.length > 0 ||
        searchQuery.length > 0;

    return {
        selectedCategories,
        selectedAgeRanges,
        searchQuery,
        setSearchQuery,
        toggleCategory,
        toggleAgeRange,
        clearAllFilters,
        hasActiveFilters,
    };
}

// Custom hook for processed video data
function useProcessedVideos(
    videos: Video[],
    filters: ReturnType<typeof useFilterState>,
) {
    const normalizedVideos = useMemo(() => videos.map(normalizeVideo), [videos]);
    const filteredVideos = useMemo(
        () =>
            filterVideos(
                normalizedVideos,
                filters.selectedCategories,
                filters.selectedAgeRanges,
                filters.searchQuery,
            ),
        [
            normalizedVideos,
            filters.selectedCategories,
            filters.selectedAgeRanges,
            filters.searchQuery,
        ],
    );
    const categoryCounts = useMemo(
        () => calculateCounts(normalizedVideos, "category"),
        [normalizedVideos],
    );
    const ageRangeCounts = useMemo(
        () => calculateCounts(normalizedVideos, "ageRange"),
        [normalizedVideos],
    );

    return { filteredVideos, categoryCounts, ageRangeCounts };
}

export default function VideoGallery({ videos }: VideoGalleryProps) {
    const filters = useFilterState();
    const { filteredVideos, categoryCounts, ageRangeCounts } = useProcessedVideos(
        videos,
        filters,
    );
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const { user } = useAuth();

    // Fetch categories from the Payload CMS categories collection
    const { categories: fetchedCategories } = useFetchCategories();

    const isAdmin = user?.role === "admin" || user?.role === "superadmin";

    return (
        <div className="flex gap-6">
            <Sidebar
                searchQuery={filters.searchQuery}
                setSearchQuery={filters.setSearchQuery}
                categories={fetchedCategories}
                categoryCounts={categoryCounts}
                ageRangeCounts={ageRangeCounts}
                selectedCategories={filters.selectedCategories}
                selectedAgeRanges={filters.selectedAgeRanges}
                toggleCategory={filters.toggleCategory}
                toggleAgeRange={filters.toggleAgeRange}
                hasActiveFilters={filters.hasActiveFilters}
                clearAllFilters={filters.clearAllFilters}
                onManageCategories={() => setShowCategoryManager(true)}
                isAdmin={isAdmin}
            />

            <MobileFilters
                searchQuery={filters.searchQuery}
                setSearchQuery={filters.setSearchQuery}
                categories={fetchedCategories}
                selectedCategories={filters.selectedCategories}
                toggleCategory={filters.toggleCategory}
            />

            <main className="flex-1 min-w-0 pb-20 md:pb-0">
                <ResultsHeader
                    count={filteredVideos.length}
                    hasActiveFilters={filters.hasActiveFilters}
                />
                {filteredVideos.length === 0 ? (
                    <EmptyState hasActiveFilters={filters.hasActiveFilters} />
                ) : (
                    <VirtualizedVideoGrid videos={filteredVideos} />
                )}
            </main>

            {/* Category management modal (admin only) */}
            {isAdmin && (
                <CategoryManager
                    open={showCategoryManager}
                    onClose={() => setShowCategoryManager(false)}
                />
            )}
        </div>
    );
}

// Simple grid component (removed virtualization for better layout stability)
function VirtualizedVideoGrid({ videos }: { videos: NormalizedVideo[] }) {
    if (videos.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-20">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
}

// Extracted video card component for cleaner code
function VideoCard({ video }: { video: NormalizedVideo }) {
    const [isTheatre, setIsTheatre] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    const handlePlay = useCallback(() => {
        setShowVideo(true);
        setIsTheatre(true);
    }, []);

    const handleCloseTheatre = useCallback(() => {
        setIsTheatre(false);
        setShowVideo(false);
    }, []);

    if (isTheatre) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                <div className="w-full h-full">
                    <div className="w-full h-full bg-black overflow-hidden">
                        <VideoThumbnail
                            video={video}
                            isTheatre={isTheatre}
                            showVideo={showVideo}
                            onPlay={handlePlay}
                            onToggleTheatre={handleCloseTheatre}
                        />
                    </div>
                </div>
                <button
                    onClick={handleCloseTheatre}
                    className="absolute top-4 right-4 text-white/70 hover:text-white p-2 transition-colors"
                    aria-label="Close theatre mode"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden p-0">
            <div className="aspect-video bg-black">
                <VideoThumbnail
                    video={video}
                    isTheatre={isTheatre}
                    showVideo={showVideo}
                    onPlay={handlePlay}
                    onToggleTheatre={() => setIsTheatre(true)}
                />
            </div>
            <CardContent className="p-3 space-y-2">
                <h2 className="font-medium text-sm line-clamp-2">{video.title}</h2>
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                        {video.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        {video.ageRange}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
