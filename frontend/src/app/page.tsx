import { Suspense } from "react";
import { getPublishedVideos } from "@/lib/sanity";
import VideoGallery from "@/components/VideoGallery";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "../../../utils/logger";

// Enable ISR (Incremental Static Regeneration) for better Vercel performance
export const revalidate = 300; // 5 minutes

function VideoGallerySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <div className="aspect-video bg-muted animate-pulse" />
            <CardContent className="p-4 space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function VideoContent() {
  try {
    const videos = await getPublishedVideos();
    return <VideoGallery videos={videos} />;
  } catch (error) {
    logger.error('Failed to load videos', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return (
      <Card>
        <CardContent className="p-16 text-center">
          <p className="text-xl text-destructive mb-4">
            Unable to load videos at this time
          </p>
          <p className="text-muted-foreground">
            Please try refreshing the page. If the problem persists, contact support.
          </p>
        </CardContent>
      </Card>
    );
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<VideoGallerySkeleton />}>
          <VideoContent />
        </Suspense>
      </main>
    </div>
  );
}
