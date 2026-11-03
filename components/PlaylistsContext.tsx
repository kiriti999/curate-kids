"use client";

import {
    createContext,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { useAuth } from "@/components/AuthProvider";

export interface PlaylistSummary {
    id: string;
    title: string;
    videoIds: string[];
}

interface PlaylistsState {
    playlists: PlaylistSummary[] | null;
    setPlaylists: Dispatch<SetStateAction<PlaylistSummary[] | null>>;
    error: string;
}

const PlaylistsContext = createContext<PlaylistsState | null>(null);

/** Loads the signed-in user's playlists once so every video card can share them. */
export function PlaylistsProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        fetch("/api/playlists", { credentials: "include" })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((data) => !cancelled && setPlaylists(data.playlists))
            .catch(() => !cancelled && setError("Couldn't load playlists"));
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    return (
        <PlaylistsContext.Provider value={{ playlists, setPlaylists, error }}>
            {children}
        </PlaylistsContext.Provider>
    );
}

export function usePlaylists(): PlaylistsState {
    const ctx = useContext(PlaylistsContext);
    if (!ctx) throw new Error("usePlaylists must be used inside PlaylistsProvider");
    return ctx;
}
