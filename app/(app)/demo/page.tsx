import { Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import DemoHeader from "@/components/DemoHeader";
import Footer from "@/components/Footer";
import SampleVideoGallery from "@/components/SampleVideoGallery";

export const metadata: Metadata = {
    title: "Demo | CuratedReels - See How Your Video Library Will Look",
    description:
        "Preview how CuratedReels displays your curated video content. Experience the clean, organized interface before deploying your own instance.",
};

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Demo Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            This is a live demo of CuratedReels video library
                        </span>
                    </div>
                    <Link
                        href="/pricing"
                        className="text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full transition-colors"
                    >
                        Get Your Own Instance →
                    </Link>
                </div>
            </div>

            {/* Header */}
            <DemoHeader />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        Sample Video Library
                    </h1>
                    <p className="text-muted-foreground">
                        This is how your curated video content will appear to your users.
                        Videos are organized by categories with search and filter
                        capabilities.
                    </p>
                </div>
                <SampleVideoGallery />
            </main>

            {/* Bottom CTA */}
            <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Ready to Create Your Own Video Library?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Deploy your own CuratedReels instance in minutes with our simple CLI
                        tool.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/pricing"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            View Pricing
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
