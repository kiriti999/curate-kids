import { Heart, Shield, Target, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
    title: "About Us | CuratedReels",
    description:
        "Learn about CuratedReels and WhatsNxt Private Limited. Our mission is to provide safe, curated video content for education.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PageHeader title="About Us" />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        About CuratedReels
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Empowering safe, educational content curation
                    </p>
                </div>

                {/* Company Info */}
                <div className="prose dark:prose-invert max-w-none mb-12">
                    <h2>Our Company</h2>
                    <p>
                        CuratedReels is a product of{" "}
                        <strong>WhatsNxt Private Limited</strong>, a technology company
                        focused on creating innovative solutions for education and content
                        management.
                    </p>
                    <p>
                        We believe that in today&apos;s digital world, having control over
                        the content your students, children, or team members consume is
                        essential. CuratedReels was born from this belief—a platform that
                        puts content curation in your hands.
                    </p>
                </div>

                {/* Values */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                            <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Our Mission
                        </h3>
                        <p className="text-muted-foreground">
                            To provide schools, parents, and organizations with tools to
                            create safe, distraction-free video libraries for education and
                            training.
                        </p>
                    </div>

                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Our Vision
                        </h3>
                        <p className="text-muted-foreground">
                            A world where every learner has access to quality, curated
                            educational content without the distractions of open platforms.
                        </p>
                    </div>

                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4">
                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Who We Serve
                        </h3>
                        <p className="text-muted-foreground">
                            Schools, educators, parents, corporate trainers, and any
                            organization that values controlled content distribution.
                        </p>
                    </div>

                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center mb-4">
                            <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Our Values
                        </h3>
                        <p className="text-muted-foreground">
                            Quality over quantity, privacy by design, and intuitive user
                            experience.
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-blue-100 mb-6">
                        Join hundreds of schools and organizations using CuratedReels.
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-medium rounded-xl hover:bg-blue-50 transition-colors"
                    >
                        View Pricing
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
