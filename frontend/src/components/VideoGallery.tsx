'use client'

import { useState, useMemo } from 'react'
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

// Support both Sanity and PayloadCMS data structures
interface Video {
    // PayloadCMS fields (preferred)
    id?: string
    title: string
    youtubeId?: string | null
    youtubeUrl: string
    category: string
    ageRange: string
    tags?: Array<{ tag: string; id?: string | null }> | string[] | null
    createdAt?: string
    
    // Sanity fields (legacy - for backward compatibility)
    _id?: string
    _createdAt?: string
}

// Normalize video data to handle both Sanity and PayloadCMS formats
function normalizeVideo(video: Video): Video & { _id: string; tags: string[] } {
    return {
        ...video,
        _id: video.id || video._id || '',
        youtubeId: video.youtubeId || '',
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

function VideoThumbnail({ video }: { video: Video & { _id: string; youtubeId: string } }) {
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

    const filteredVideos = useMemo(() => {
        return videos.map(normalizeVideo).filter((video) => {
            if (
                selectedCategories.length > 0 &&
                !selectedCategories.includes(video.category)
            ) {
                return false
            }

            if (
                selectedAgeRanges.length > 0 &&
                !selectedAgeRanges.includes(video.ageRange)
            ) {
                return false
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = video.title.toLowerCase().includes(query)
                const matchesTags = video.tags?.some((tag) =>
                    tag.toLowerCase().includes(query)
                )
                return matchesTitle || matchesTags
            }

            return true
        })
    }, [videos, selectedCategories, selectedAgeRanges, searchQuery])

    const hasActiveFilters =
        selectedCategories.length > 0 ||
        selectedAgeRanges.length > 0 ||
        searchQuery.length > 0

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    {/* Search Row */}
                    <div className="flex items-center gap-4">
                        <Input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                        {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={clearAllFilters}>
                                Clear filters ({filteredVideos.length} results)
                            </Button>
                        )}
                    </div>

                    {/* Filter Chips Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category.value}
                                onClick={() => toggleCategory(category.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                    selectedCategories.includes(category.value)
                                        ? "bg-violet-600 text-white"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                {category.label}
                            </button>
                        ))}
                        <span className="text-muted-foreground mx-2">|</span>
                        {AGE_RANGES.map((ageRange) => (
                            <button
                                key={ageRange.value}
                                onClick={() => toggleAgeRange(ageRange.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                    selectedAgeRanges.includes(ageRange.value)
                                        ? "bg-blue-600 text-white"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                {ageRange.label}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Videos Grid */}
            {filteredVideos.length === 0 ? (
                <Card>
                    <CardContent className="p-16 text-center">
                        <p className="text-xl text-muted-foreground">
                            {hasActiveFilters
                                ? 'No videos match your filters. Try adjusting your selection.'
                                : 'No videos published yet. Add some in Sanity Studio!'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                        <Card key={video._id} className="overflow-hidden p-0">
                            <div className="aspect-video bg-black">
                                <VideoThumbnail video={video} />
                            </div>
                            <CardContent className="p-4 space-y-3">
                                <h2 className="font-semibold text-lg">
                                    {video.title}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    <Badge>{video.category}</Badge>
                                    <Badge variant="secondary">{video.ageRange} years</Badge>
                                </div>
                                {video.tags && video.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {video.tags.slice(0, 3).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs text-muted-foreground"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
