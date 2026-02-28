"use client";

import { Clock, Play, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Sample videos for demo display
const SAMPLE_VIDEOS = [
    {
        id: "1",
        title: "Introduction to Solar System",
        description: "Learn about the planets, moons, and other celestial bodies in our solar system.",
        thumbnailUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=640&h=360&fit=crop",
        duration: "12:45",
        category: "Science",
        tags: ["Space", "Astronomy", "Planets"],
    },
    {
        id: "2",
        title: "Basic Mathematics - Fractions",
        description: "Understanding fractions, decimals, and their applications in daily life.",
        thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=640&h=360&fit=crop",
        duration: "8:30",
        category: "Mathematics",
        tags: ["Fractions", "Numbers", "Basics"],
    },
    {
        id: "3",
        title: "World History: Ancient Civilizations",
        description: "Explore the rise and fall of ancient civilizations including Egypt, Rome, and Greece.",
        thumbnailUrl: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=640&h=360&fit=crop",
        duration: "15:20",
        category: "History",
        tags: ["Ancient", "Civilizations", "Culture"],
    },
    {
        id: "4",
        title: "Creative Writing Workshop",
        description: "Tips and techniques to improve your creative writing skills.",
        thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=640&h=360&fit=crop",
        duration: "10:15",
        category: "Language Arts",
        tags: ["Writing", "Creativity", "Stories"],
    },
    {
        id: "5",
        title: "Introduction to Coding",
        description: "Learn the basics of programming with fun, interactive examples.",
        thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=360&fit=crop",
        duration: "18:00",
        category: "Technology",
        tags: ["Coding", "Programming", "Tech"],
    },
    {
        id: "6",
        title: "Art Fundamentals: Color Theory",
        description: "Understanding color wheels, complementary colors, and how to use them effectively.",
        thumbnailUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&h=360&fit=crop",
        duration: "9:45",
        category: "Art",
        tags: ["Colors", "Design", "Painting"],
    },
    {
        id: "7",
        title: "Physical Education: Team Sports",
        description: "Learn the rules and strategies of popular team sports like basketball and soccer.",
        thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=640&h=360&fit=crop",
        duration: "14:30",
        category: "Physical Education",
        tags: ["Sports", "Fitness", "Teamwork"],
    },
    {
        id: "8",
        title: "Music Theory Basics",
        description: "Introduction to notes, scales, and rhythm for beginners.",
        thumbnailUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=640&h=360&fit=crop",
        duration: "11:20",
        category: "Music",
        tags: ["Music", "Theory", "Instruments"],
    },
    {
        id: "9",
        title: "Environmental Science: Climate Change",
        description: "Understanding the causes and effects of climate change on our planet.",
        thumbnailUrl: "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=640&h=360&fit=crop",
        duration: "16:40",
        category: "Science",
        tags: ["Environment", "Climate", "Nature"],
    },
];

const CATEGORIES = ["All", "Science", "Mathematics", "History", "Language Arts", "Technology", "Art", "Music"];

type SampleVideo = (typeof SAMPLE_VIDEOS)[0];

function SampleVideoCard({ video }: { video: SampleVideo }) {
    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
            <div className="relative aspect-video bg-muted">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/640x360/1e293b/64748b?text=${encodeURIComponent(video.category)}`;
                    }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-6 w-6 text-blue-600 ml-1" fill="currentColor" />
                    </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {video.duration}
                </div>
                <Badge className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-600">
                    {video.category}
                </Badge>
            </div>
            <CardContent className="p-4">
                <h3 className="font-semibold text-foreground line-clamp-1 mb-2">
                    {video.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {video.description}
                </p>
                <div className="flex flex-wrap gap-1">
                    {video.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground"
                        >
                            <Tag className="h-3 w-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SampleVideoGallery() {
    return (
        <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category, index) => (
                    <button
                        key={category}
                        type="button"
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${index === 0
                                ? "bg-blue-600 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SAMPLE_VIDEOS.map((video) => (
                    <SampleVideoCard key={video.id} video={video} />
                ))}
            </div>

            {/* Sample indicator */}
            <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                    Showing sample videos • Your library will display your own curated content
                </p>
            </div>
        </div>
    );
}
