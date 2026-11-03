import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";
import Header from "@/components/Header";
import PlaylistsManager from "@/components/PlaylistsManager";

export const metadata: Metadata = {
    title: "My Playlists | CuratedReels",
    description: "Your curated video playlists.",
};

export default function PlaylistsPage() {
    return (
        <AuthGate>
            <div className="min-h-screen bg-background">
                <Header />
                <main className="max-w-4xl mx-auto px-4 py-8">
                    <PlaylistsManager />
                </main>
            </div>
        </AuthGate>
    );
}
