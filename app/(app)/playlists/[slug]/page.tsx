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

    // Access rules on the collection decide whether this viewer may see the playlist
    const result = await payload.find({
        collection: "playlists",
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: false,
        user,
    });
    const playlist: any = result.docs[0];
    if (!playlist) return null;

    // A viewer who may open the playlist may play everything in it, even videos
    // from another organization, so load the videos without per-user scoping
    const ids: string[] = (playlist.items || []).map((i: any) =>
        typeof i.video === "object" ? i.video?.id : i.video,
    );
    const found = ids.length
        ? await payload.find({
              collection: "videos",
              where: { id: { in: ids }, status: { equals: "approved" } },
              limit: ids.length,
              depth: 0,
              overrideAccess: true,
          })
        : { docs: [] };
    const byId = new Map<string, any>(found.docs.map((v: any): [string, any] => [v.id, v]));
    const videos: PlaylistVideo[] = ids
        .map((id) => byId.get(id))
        .filter(Boolean)
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
