"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PlaylistSummary {
    id: string;
    title: string;
    slug: string;
    isPublic: boolean;
    videoIds: string[];
}

/** Lists the signed-in user's playlists with create / share / delete actions. */
export default function PlaylistsManager() {
    const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/playlists", { credentials: "include" })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setPlaylists(d.playlists))
            .catch(() => {
                setPlaylists([]);
                setError("Couldn't load playlists. Please sign in and try again.");
            });
    }, []);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setError("");
        const res = await fetch("/api/playlists", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });
        if (!res.ok) return setError("Couldn't create playlist");
        const { playlist } = await res.json();
        setPlaylists((prev) => [playlist, ...(prev || [])]);
        setTitle("");
    };

    const setVisibility = async (p: PlaylistSummary, isPublic: boolean) => {
        const res = await fetch(`/api/playlists/${p.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublic }),
        });
        if (res.ok)
            setPlaylists((prev) =>
                (prev || []).map((x) => (x.id === p.id ? { ...x, isPublic } : x)),
            );
    };

    const remove = async (p: PlaylistSummary) => {
        if (!confirm(`Delete "${p.title}"?`)) return;
        const res = await fetch(`/api/playlists/${p.id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (res.ok) setPlaylists((prev) => (prev || []).filter((x) => x.id !== p.id));
    };

    const copyLink = (p: PlaylistSummary) =>
        navigator.clipboard.writeText(`${window.location.origin}/playlists/${p.slug}`);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">My Playlists</h1>

            <form onSubmit={create} className="flex gap-2">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="New playlist name"
                    maxLength={120}
                    className="flex-1 border rounded px-3 py-2 bg-background"
                />
                <button
                    type="submit"
                    disabled={!title.trim()}
                    className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                >
                    Create
                </button>
            </form>
            {error && <p className="text-sm text-destructive">{error}</p>}

            {playlists === null && <p className="text-muted-foreground">Loading…</p>}
            {playlists?.length === 0 && !error && (
                <p className="text-muted-foreground">
                    No playlists yet. Create one here, or use "➕ Playlist" on any video.
                </p>
            )}

            <div className="space-y-3">
                {playlists?.map((p) => (
                    <Card key={p.id}>
                        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <Link
                                    href={`/playlists/${p.slug}`}
                                    className="font-medium hover:underline"
                                >
                                    {p.title}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                    {p.videoIds.length} video{p.videoIds.length === 1 ? "" : "s"} ·{" "}
                                    {p.isPublic ? "Public" : "Private"}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={p.isPublic}
                                        onChange={(e) => setVisibility(p, e.target.checked)}
                                    />
                                    Public
                                </label>
                                {p.isPublic && (
                                    <button
                                        type="button"
                                        onClick={() => copyLink(p)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Copy link
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => remove(p)}
                                    className="text-destructive hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
