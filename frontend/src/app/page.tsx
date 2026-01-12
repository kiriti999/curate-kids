import { getPublishedVideos } from "@/lib/sanity";
import VideoGallery from "@/components/VideoGallery";
import Header from "@/components/Header";

export default async function Home() {
  const videos = await getPublishedVideos();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <VideoGallery videos={videos} />
      </main>
    </div>
  );
}
