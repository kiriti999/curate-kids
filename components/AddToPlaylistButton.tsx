"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { type PlaylistSummary, usePlaylists } from "@/components/PlaylistsContext";

/** "Add to playlist" menu for a video card. Renders nothing for signed-out users. */
export default function AddToPlaylistButton({ videoId }: { videoId: string }) {
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const { playlists, setPlaylists, error: loadError } = usePlaylists();
    const [newTitle, setNewTitle] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);
    const inPlaylist = !!playlists?.some((p) => p.videoIds.includes(videoId));

    // Close when clicking outside
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    if (!isAuthenticated) return null;

    const toggle = async (p: PlaylistSummary) => {
        const has = p.videoIds.includes(videoId);
        setBusy(true);
        setError("");
        try {
            const res = await fetch(
                has
                    ? `/api/playlists/${p.id}/items?videoId=${encodeURIComponent(videoId)}`
                    : `/api/playlists/${p.id}/items`,
                {
                    method: has ? "DELETE" : "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: has ? undefined : JSON.stringify({ videoId }),
                },
            );
            if (!res.ok) throw new Error();
            setPlaylists((prev) =>
                (prev || []).map((x) =>
                    x.id === p.id
                        ? {
                              ...x,
                              videoIds: has
                                  ? x.videoIds.filter((v) => v !== videoId)
                                  : [...x.videoIds, videoId],
                          }
                        : x,
                ),
            );
        } catch {
            setError("Something went wrong");
        } finally {
            setBusy(false);
        }
    };

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setBusy(true);
        setError("");
        try {
            const res = await fetch("/api/playlists", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle, videoId }),
            });
            if (!res.ok) throw new Error();
            const { playlist } = await res.json();
            setPlaylists((prev) => [playlist, ...(prev || [])]);
            setNewTitle("");
        } catch {
            setError("Couldn't create playlist");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`text-xs whitespace-nowrap border rounded-full px-2.5 py-1 transition-colors ${
                    inPlaylist
                        ? "border-green-500/60 text-green-500 hover:text-green-400"
                        : "text-muted-foreground hover:text-foreground"
                }`}
                aria-haspopup="menu"
                aria-expanded={open}
                title={inPlaylist ? "In one of your playlists" : "Add to a playlist"}
            >
                {inPlaylist ? "✓ In playlist" : "➕ Playlist"}
            </button>
            {open && (
                <div
                    role="menu"
                    className="absolute right-0 bottom-full mb-2 z-20 w-64 rounded-lg border bg-background shadow-lg p-2 space-y-1"
                >
                    {playlists === null && !error && !loadError && (
                        <p className="text-xs text-muted-foreground p-2">Loading…</p>
                    )}
                    {playlists?.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">
                            No playlists yet. Create one below.
                        </p>
                    )}
                    <div className="max-h-48 overflow-y-auto">
                        {playlists?.map((p) => (
                            <label
                                key={p.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={p.videoIds.includes(videoId)}
                                    disabled={busy}
                                    onChange={() => toggle(p)}
                                />
                                <span className="truncate">{p.title}</span>
                            </label>
                        ))}
                    </div>
                    <form onSubmit={create} className="flex gap-1 pt-1 border-t">
                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="New playlist"
                            maxLength={120}
                            className="flex-1 min-w-0 text-sm border rounded px-2 py-1 bg-background"
                        />
                        <button
                            type="submit"
                            disabled={busy || !newTitle.trim()}
                            className="text-sm px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                        >
                            Add
                        </button>
                    </form>
                    {(error || loadError) && (
                        <p className="text-xs text-destructive px-1">{error || loadError}</p>
                    )}
                </div>
            )}
        </div>
    );
}
