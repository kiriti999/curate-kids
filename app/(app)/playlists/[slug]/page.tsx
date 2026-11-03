import config from "@payload-config";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import Header from "@/components/Header";
import PlaylistPlayer, { type PlaylistVideo } from "@/components/PlaylistPlayer";

export const dynamic = "force-dynamic"; // visibility depends on the viewer

async function loadPlaylist(slug: string) {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: await headers() });

    // Access rules on the collection decide whether this viewer may see it
    const result = await payload.find({
        collection: "playlists",
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
        overrideAccess: false,
        user,
    });
    const playlist: any = result.docs[0];
    if (!playlist) return null;

    const videos: PlaylistVideo[] = (playlist.items || [])
        .map((i: any) => i.video)
        // depth:1 gives objects; skip deleted refs and unapproved videos
        .filter((v: any) => v && typeof v === "object" && v.status === "approved")
        .map((v: any) => ({
            id: v.id,
            title: v.title,
            youtubeId: v.youtubeId || "",
            cloudinaryUrl: v.cloudinaryUrl || "",
            source: v.source || "url",
            thumbnailUrl: v.thumbnailUrl || "",
        }));

    return {
        id: playlist.id as string,
        title: playlist.title as string,
        description: (playlist.description as string) || "",
        videos,
        canEdit:
            !!user &&
            (user.role === "admin" ||
                user.role === "superadmin" ||
                (typeof playlist.owner === "object" ? playlist.owner.id : playlist.owner) === user.id),
    };
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const playlist = await loadPlaylist((await params).slug);
    return { title: playlist ? `${playlist.title} | CuratedReels` : "Playlist | CuratedReels" };
}

export default async function PlaylistPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const playlist = await loadPlaylist((await params).slug);
    if (!playlist) notFound();

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <PlaylistPlayer
                    playlistId={playlist.id}
                    title={playlist.title}
                    description={playlist.description}
                    videos={playlist.videos}
                    canEdit={playlist.canEdit}
                />
            </main>
        </div>
    );
}
