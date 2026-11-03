"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGate from "@/components/AuthGate";
import Header from "@/components/Header";
import { Shield, ShieldCheck, ShieldX, Download, ExternalLink, RefreshCw, Monitor } from "lucide-react";

const API_BASE = "http://127.0.0.1:45192";

// Installer URLs. No installers are published yet, so the download section is
// hidden unless NEXT_PUBLIC_SAFE_BROWSE_DOWNLOAD_BASE points at a location
// that serves CurateKids-Safe-Browse.dmg and CurateKids-Safe-Browse-setup.exe.
const DOWNLOAD_BASE = process.env.NEXT_PUBLIC_SAFE_BROWSE_DOWNLOAD_BASE;

const DOWNLOAD_MAC = `${DOWNLOAD_BASE}/CurateKids-Safe-Browse.dmg`;
const DOWNLOAD_WIN = `${DOWNLOAD_BASE}/CurateKids-Safe-Browse-setup.exe`;

type AppStatus = "checking" | "running" | "not-running";
type BlockStatus = "blocked" | "unblocked" | "unknown";

export default function ParentalControlsPage() {
    return (
        <AuthGate>
            <Header />
            <ParentalControls />
        </AuthGate>
    );
}

function ParentalControls() {
    const [appStatus, setAppStatus] = useState<AppStatus>("checking");
    const [blockStatus, setBlockStatus] = useState<BlockStatus>("unknown");
    const [version, setVersion] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/status`, {
                signal: AbortSignal.timeout(2000),
            });
            const data = await res.json();
            setAppStatus("running");
            setBlockStatus(data.blocked ? "blocked" : "unblocked");
            setVersion(data.version || "");
            setError(null);
        } catch {
            setAppStatus("not-running");
            setBlockStatus("unknown");
        }
    }, []);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    const toggleBlocking = async () => {
        if (loading || appStatus !== "running") return;

        setLoading(true);
        setError(null);

        const endpoint = blockStatus === "blocked" ? "disable" : "enable";

        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                method: "POST",
                signal: AbortSignal.timeout(30000), // 30s for admin prompt
            });
            const data = await res.json();
            if (data.success) {
                setBlockStatus(data.blocked ? "blocked" : "unblocked");
            } else {
                setError(data.error || "Operation failed");
            }
        } catch {
            setError("Failed to communicate with Safe Browse app");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Page header */}
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="w-8 h-8 text-blue-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Parental Controls
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage safe browsing for your child&apos;s device
                        </p>
                    </div>
                </div>

                {/* Status card */}
                {appStatus === "checking" && (
                    <div className="bg-card border rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
                            <span className="text-muted-foreground">
                                Checking for Safe Browse companion app...
                            </span>
                        </div>
                    </div>
                )}

                {appStatus === "running" && (
                    <>
                        {/* Blocking status */}
                        <div
                            className={`border rounded-xl p-6 mb-6 transition-colors ${blockStatus === "blocked"
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-red-500/10 border-red-500/30"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {blockStatus === "blocked" ? (
                                        <ShieldCheck className="w-10 h-10 text-green-500" />
                                    ) : (
                                        <ShieldX className="w-10 h-10 text-red-500" />
                                    )}
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            {blockStatus === "blocked"
                                                ? "YouTube Blocked"
                                                : "YouTube Accessible"}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {blockStatus === "blocked"
                                                ? "Kids can only watch curated videos in this app"
                                                : "YouTube browsing is not restricted on this device"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleBlocking}
                                    disabled={loading}
                                    className={`px-6 py-2.5 rounded-lg font-medium text-white text-sm transition-all ${loading
                                            ? "opacity-50 cursor-not-allowed bg-gray-500"
                                            : blockStatus === "blocked"
                                                ? "bg-red-500 hover:bg-red-600"
                                                : "bg-green-500 hover:bg-green-600"
                                        }`}
                                >
                                    {loading
                                        ? "Please wait..."
                                        : blockStatus === "blocked"
                                            ? "Disable"
                                            : "Enable"}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}

                        {/* Info section */}
                        <div className="bg-card border rounded-xl p-6 mb-6">
                            <h3 className="font-semibold text-foreground mb-3">
                                How it works
                            </h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Curated videos in this app play normally
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    Video thumbnails and streams are not affected
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">✗</span>
                                    youtube.com, m.youtube.com and YouTube apps are blocked
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5">✗</span>
                                    Clicking the YouTube logo in the player goes nowhere
                                </li>
                            </ul>
                        </div>

                        {/* App info */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5" />
                                <span>
                                    Safe Browse {version ? `v${version}` : ""} — running on
                                    127.0.0.1:45192
                                </span>
                            </div>
                            <button
                                onClick={checkStatus}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                            </button>
                        </div>
                    </>
                )}

                {appStatus === "not-running" && (
                    <>
                        {/* App not detected */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Shield className="w-6 h-6 text-amber-500" />
                                <h2 className="text-lg font-semibold text-foreground">
                                    Companion App Required
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                The Safe Browse companion app needs to be running on this
                                device to manage YouTube blocking from this page.
                            </p>
                        </div>

                        {/* Download section (only when installers are configured) */}
                        {DOWNLOAD_BASE && (
                        <div className="bg-card border rounded-xl p-6 mb-6">
                            <h3 className="font-semibold text-foreground mb-4">
                                Download Safe Browse
                            </h3>
                            <div className="grid gap-3">
                                <a
                                    href={DOWNLOAD_MAC}
                                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <Download className="w-5 h-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <span className="font-medium text-foreground">macOS</span>
                                        <p className="text-xs text-muted-foreground">
                                            .dmg — macOS 10.15+
                                        </p>
                                    </div>
                                </a>
                                <a
                                    href={DOWNLOAD_WIN}
                                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <Download className="w-5 h-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <span className="font-medium text-foreground">Windows</span>
                                        <p className="text-xs text-muted-foreground">
                                            .exe installer — Windows 10+
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </div>
                        )}

                        {/* Alternative: manual scripts */}
                        <div className="bg-card border rounded-xl p-6 mb-6">
                            <h3 className="font-semibold text-foreground mb-2">
                                Alternative: Manual scripts
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                {DOWNLOAD_BASE
                                    ? "If you prefer not to install the companion app, you can download standalone scripts to run manually."
                                    : "The companion app isn't available yet. Download a standalone script to block YouTube on this device instead."}
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href="/scripts/block-youtube-mac.sh"
                                    download
                                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Mac script
                                </a>
                                <a
                                    href="/scripts/block-youtube-win.bat"
                                    download
                                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Windows script
                                </a>
                            </div>
                        </div>

                        {/* Retry */}
                        <div className="text-center">
                            <button
                                onClick={checkStatus}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mx-auto"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Companion app already running? Click to retry connection
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
