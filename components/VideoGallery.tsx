'use client'

import { useState, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Check if a string is a valid YouTube video ID (11 alphanumeric characters)
 */
function isValidYoutubeId(id: string | undefined | null): boolean {
    if (!id) return false
    return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

// PayloadCMS Video interface
interface Video {
    id: string
    title: string
    youtubeId?: string | null
    youtubeUrl: string
    category: string
    ageRange: string
    tags?: Array<{ tag: string; id?: string | null }> | string[] | null
    createdAt?: string
}

// Normalized video with string[] tags
interface NormalizedVideo {
    id: string
    title: string
    youtubeId: string
    youtubeUrl: string
    category: string
    ageRange: string
    tags: string[]
    createdAt?: string
}

// Normalize video data for consistent rendering
function normalizeVideo(video: Video): NormalizedVideo {
    return {
        id: video.id,
        title: video.title,
        youtubeId: video.youtubeId || '',
        youtubeUrl: video.youtubeUrl,
        category: video.category,
        ageRange: video.ageRange,
        createdAt: video.createdAt,
        tags: Array.isArray(video.tags)
            ? video.tags.map(tag => typeof tag === 'string' ? tag : tag.tag)
            : [],
    }
}

interface VideoGalleryProps {
    videos: Video[]
}

const CATEGORIES = [
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'music', label: 'Music' },
    { value: 'science', label: 'Science' },
    { value: 'arts-crafts', label: 'Arts & Crafts' },
    { value: 'sports', label: 'Sports' },
    { value: 'nature', label: 'Nature' },
    { value: 'stories', label: 'Stories' },
]

const AGE_RANGES = [
    { value: '0-2', label: '0-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '6-8', label: '6-8 years' },
    { value: '9-12', label: '9-12 years' },
    { value: '13+', label: '13+ years' },
]

function VideoThumbnail({ video }: { video: NormalizedVideo }) {
    const [showVideo, setShowVideo] = useState(false)
    const hasValidYoutubeId = isValidYoutubeId(video.youtubeId)

    if (showVideo && hasValidYoutubeId) {
        return (
            <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        )
    }

    // Show placeholder for non-YouTube videos
    if (!hasValidYoutubeId) {
        return (
            <div className="relative w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center p-4">
                    <svg className="w-12 h-12 mx-auto text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-muted-foreground">External video</p>
                </div>
            </div>
        )
    }

    return (
        <button
            onClick={() => setShowVideo(true)}
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
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        </button>
    )
}

// Filter helper functions
function matchesCategoryFilter(video: NormalizedVideo, selectedCategories: string[]): boolean {
    if (selectedCategories.length === 0) return true
    return selectedCategories.includes(video.category)
}

function matchesAgeRangeFilter(video: NormalizedVideo, selectedAgeRanges: string[]): boolean {
    if (selectedAgeRanges.length === 0) return true
    return selectedAgeRanges.includes(video.ageRange)
}

function matchesSearchQuery(video: NormalizedVideo, searchQuery: string): boolean {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const matchesTitle = video.title.toLowerCase().includes(query)
    const matchesTags = video.tags?.some((tag) => tag.toLowerCase().includes(query))
    return matchesTitle || matchesTags
}

function filterVideos(
    videos: NormalizedVideo[],
    selectedCategories: string[],
    selectedAgeRanges: string[],
    searchQuery: string
): NormalizedVideo[] {
    return videos.filter((video) =>
        matchesCategoryFilter(video, selectedCategories) &&
        matchesAgeRangeFilter(video, selectedAgeRanges) &&
        matchesSearchQuery(video, searchQuery)
    )
}

export default function VideoGallery({ videos }: VideoGalleryProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        )
    }

    const toggleAgeRange = (ageRange: string) => {
        setSelectedAgeRanges((prev) =>
            prev.includes(ageRange)
                ? prev.filter((a) => a !== ageRange)
                : [...prev, ageRange]
        )
    }

    const clearAllFilters = () => {
        setSelectedCategories([])
        setSelectedAgeRanges([])
        setSearchQuery('')
    }

    // Count videos per category and age range
    const normalizedVideos = useMemo(() => videos.map(normalizeVideo), [videos])

    const filteredVideos = useMemo(() => 
        filterVideos(normalizedVideos, selectedCategories, selectedAgeRanges, searchQuery),
        [normalizedVideos, selectedCategories, selectedAgeRanges, searchQuery]
    )

    const hasActiveFilters =
        selectedCategories.length > 0 ||
        selectedAgeRanges.length > 0 ||
        searchQuery.length > 0



    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        normalizedVideos.forEach(v => {
            counts[v.category] = (counts[v.category] || 0) + 1
        })
        return counts
    }, [normalizedVideos])

    const ageRangeCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        normalizedVideos.forEach(v => {
            counts[v.ageRange] = (counts[v.ageRange] || 0) + 1
        })
        return counts
    }, [normalizedVideos])

    return (
        <div className="flex gap-6">
            {/* Left Sidebar */}
            <aside className="hidden md:block w-56 flex-shrink-0">
                <div className="sticky top-4 space-y-6">
                    {/* Search */}
                    <div>
                        <Input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                            Categories
                        </h3>
                        <div className="space-y-1">
                            {CATEGORIES.map((category) => {
                                const count = categoryCounts[category.value] || 0
                                if (count === 0) return null
                                return (
                                    <button
                                        key={category.value}
                                        onClick={() => toggleCategory(category.value)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                            selectedCategories.includes(category.value)
                                                ? "bg-violet-600 text-white"
                                                : "hover:bg-muted text-foreground"
                                        )}
                                    >
                                        <span>{category.label}</span>
                                        <span className={cn(
                                            "text-xs px-1.5 py-0.5 rounded-full",
                                            selectedCategories.includes(category.value)
                                                ? "bg-violet-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Age Ranges */}
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                            Age Range
                        </h3>
                        <div className="space-y-1">
                            {AGE_RANGES.map((ageRange) => {
                                const count = ageRangeCounts[ageRange.value] || 0
                                if (count === 0) return null
                                return (
                                    <button
                                        key={ageRange.value}
                                        onClick={() => toggleAgeRange(ageRange.value)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                            selectedAgeRanges.includes(ageRange.value)
                                                ? "bg-blue-600 text-white"
                                                : "hover:bg-muted text-foreground"
                                        )}
                                    >
                                        <span>{ageRange.label}</span>
                                        <span className={cn(
                                            "text-xs px-1.5 py-0.5 rounded-full",
                                            selectedAgeRanges.includes(ageRange.value)
                                                ? "bg-blue-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full">
                            Clear all filters
                        </Button>
                    )}
                </div>
            </aside>

            {/* Mobile Filters (horizontal) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-50">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="w-32 flex-shrink-0"
                    />
                    {CATEGORIES.slice(0, 4).map((category) => (
                        <button
                            key={category.value}
                            onClick={() => toggleCategory(category.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                                selectedCategories.includes(category.value)
                                    ? "bg-violet-600 text-white"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 pb-20 md:pb-0">
                {/* Results Header */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                        {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
                        {hasActiveFilters && ' (filtered)'}
                    </p>
                </div>

                {/* Videos Grid with Virtual Scrolling */}
                {filteredVideos.length === 0 ? (
                    <Card>
                        <CardContent className="p-16 text-center">
                            <p className="text-xl text-muted-foreground">
                                {hasActiveFilters
                                    ? 'No videos match your filters. Try adjusting your selection.'
                                    : 'No videos published yet. Add videos via the admin panel!'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <VirtualizedVideoGrid videos={filteredVideos} />
                )}
            </main>
        </div>
    )
}

// Separate component for virtualized grid
function VirtualizedVideoGrid({ videos }: { videos: NormalizedVideo[] }) {
    const parentRef = useRef<HTMLDivElement>(null)
    
    // Calculate columns based on container width
    const getColumnCount = () => {
        if (typeof window === 'undefined') return 3
        const width = window.innerWidth
        if (width < 1024) return 1  // mobile
        if (width < 1280) return 2  // tablet
        return 3                     // desktop
    }
    
    const [columnCount, setColumnCount] = useState(getColumnCount)
    
    // Update columns on resize
    useMemo(() => {
        if (typeof window === 'undefined') return
        const handleResize = () => setColumnCount(getColumnCount())
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    // Group videos into rows
    const rows = useMemo(() => {
        const result: NormalizedVideo[][] = []
        for (let i = 0; i < videos.length; i += columnCount) {
            result.push(videos.slice(i, i + columnCount))
        }
        return result
    }, [videos, columnCount])
    
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 280, // Estimated row height (video card)
        overscan: 3,
    })

    return (
        <div 
            ref={parentRef} 
            className="h-[calc(100vh-200px)] overflow-auto"
            style={{ contain: 'strict' }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                        key={virtualRow.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                        }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                            {rows[virtualRow.index].map((video) => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Extracted video card component for cleaner code
function VideoCard({ video }: { video: NormalizedVideo }) {
    return (
        <Card className="overflow-hidden p-0">
            <div className="aspect-video bg-black">
                <VideoThumbnail video={video} />
            </div>
            <CardContent className="p-3 space-y-2">
                <h2 className="font-medium text-sm line-clamp-2">
                    {video.title}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">{video.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{video.ageRange}</Badge>
                </div>
            </CardContent>
        </Card>
    )
}
