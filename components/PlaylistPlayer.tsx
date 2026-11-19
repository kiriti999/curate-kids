"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PlaylistVideo {
    id: string;
    title: string;
    youtubeId: string;
    cloudinaryUrl: string;
    source: string;
    thumbnailUrl: string;
}

const YT_ENDED = 0;
let ytApiReady: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
    if (ytApiReady) return ytApiReady;
    ytApiReady = new Promise<void>((resolve) => {
        const w = window as any;
        if (w.YT?.Player) return resolve();
        w.onYouTubeIframeAPIReady = () => resolve();
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
    });
    return ytApiReady;
}

const isYoutube = (v: PlaylistVideo) => /^[a-zA-Z0-9_-]{11}$/.test(v.youtubeId);
const isCloudinary = (v: PlaylistVideo) => v.source === "telegram" && !!v.cloudinaryUrl;

/** Plays a playlist's videos in order, advancing automatically when one ends. */
export default function PlaylistPlayer({
    playlistId,
    title,
    description,
    videos: initialVideos,
    canEdit,
}: {
    playlistId: string;
    title: string;
    description: string;
    videos: PlaylistVideo[];
    canEdit: boolean;
}) {
    const [videos, setVideos] = useState(initialVideos);
    const [index, setIndex] = useState(0);
    const current = videos[index];
    const hostRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    const next = useCallback(
        () => setIndex((i) => (i + 1 < videos.length ? i + 1 : i)),
        [videos.length],
    );

    // (Re)create the YouTube player whenever the current video changes
    useEffect(() => {
        if (!current || !isYoutube(current) || !hostRef.current) return;
        let cancelled = false;
        // The API replaces its target element, so give it a fresh child each time
        const target = document.createElement("div");
        hostRef.current.replaceChildren(target);

        loadYouTubeApi().then(() => {
            if (cancelled) return;
            playerRef.current = new (window as any).YT.Player(target, {
                host: "https://www.youtube-nocookie.com",
                width: "100%",
                height: "100%",
                videoId: current.youtubeId,
                playerVars: { autoplay: 1, rel: 0, fs: 1 },
                events: {
                    onStateChange: (e: { data: number }) => {
                        if (e.data === YT_ENDED) next();
                    },
                },
            });
        });
        return () => {
            cancelled = true;
            playerRef.current?.destroy?.();
            playerRef.current = null;
        };
    }, [current, next]);

    const remove = async (video: PlaylistVideo) => {
        const res = await fetch(
            `/api/playlists/${playlistId}/items?videoId=${encodeURIComponent(video.id)}`,
            { method: "DELETE", credentials: "include" },
        );
        if (!res.ok) return;
        const removedAt = videos.findIndex((v) => v.id === video.id);
        setVideos((prev) => prev.filter((v) => v.id !== video.id));
        setIndex((i) => (removedAt < i ? i - 1 : Math.min(i, Math.max(videos.length - 2, 0))));
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                    {videos.length} video{videos.length === 1 ? "" : "s"}
                </p>
            </div>

            {videos.length === 0 ? (
                <p className="text-muted-foreground">
                    This playlist has no videos yet.
                </p>
            ) : (
                <div className="grid lg:grid-cols-[1fr_20rem] gap-6">
                    <div>
                        <div className="aspect-video bg-black rounded-xl overflow-hidden">
                            {isYoutube(current) ? (
                                <div ref={hostRef} className="w-full h-full" />
                            ) : isCloudinary(current) ? (
                                <video
                                    key={current.id}
                                    src={current.cloudinaryUrl}
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                    playsInline
                                    onEnded={next}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-white/70">
                                    This video can't be played inline.
                                </div>
                            )}
                        </div>
                        <h2 className="mt-3 font-medium">{current.title}</h2>
                        <div className="mt-2 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                                disabled={index === 0}
                                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40"
                            >
                                ← Previous
                            </button>
                            <button
                                type="button"
                                onClick={next}
                                disabled={index >= videos.length - 1}
                                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    </div>

                    <ol className="space-y-1 lg:max-h-[32rem] overflow-y-auto">
                        {videos.map((v, i) => (
                            <li
                                key={v.id}
                                className={`flex items-center gap-2 rounded px-2 py-2 text-sm ${
                                    i === index ? "bg-muted font-medium" : "hover:bg-muted/60"
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIndex(i)}
                                    className="flex-1 min-w-0 text-left flex gap-2"
                                >
                                    <span className="text-muted-foreground w-5 shrink-0">{i + 1}</span>
                                    <span className="line-clamp-2">{v.title}</span>
                                </button>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => remove(v)}
                                        aria-label={`Remove ${v.title}`}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        ✕
                                    </button>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
