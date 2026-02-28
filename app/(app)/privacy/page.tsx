import { AlertTriangle, Ban, Eye, Lock, Shield } from "lucide-react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
    title: "Privacy Policy | CuratedReels",
    description:
        "Privacy policy for CuratedReels video curation platform. Learn about our content guidelines and data practices.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PageHeader title="Privacy Policy" />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated:{" "}
                        {new Date().toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>

                {/* Content Guidelines Section */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Content Guidelines
                        </h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                        CuratedReels is a platform designed for hosting curated video
                        content. All videos and content shared through the platform must
                        adhere to the following guidelines:
                    </p>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">
                            ✓ Acceptable Content
                        </h3>
                        <ul className="text-green-700 dark:text-green-300 space-y-1 text-sm">
                            <li>• Educational videos and tutorials</li>
                            <li>• Entertainment content suitable for general audiences</li>
                            <li>• Professional and business-related videos</li>
                            <li>• Creative and artistic content</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <h3 className="font-bold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                            <Ban className="h-5 w-5" />
                            Prohibited Content
                        </h3>
                        <ul className="text-red-700 dark:text-red-300 space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="font-medium">Pornography:</span>
                                <span>Sexually explicit content is strictly prohibited.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-medium">Nudity:</span>
                                <span>Semi-nudity or full nudity content is not allowed.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-medium">Private/Personal Videos:</span>
                                <span>
                                    Personal or private videos that could compromise individual
                                    privacy are prohibited.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-medium">Harmful Content:</span>
                                <span>
                                    Violence, hate speech, or content promoting illegal
                                    activities.
                                </span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Data Collection */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Data Collection
                        </h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            CuratedReels is a self-hosted platform. When you purchase a
                            license, you host the application on your own infrastructure.
                        </p>
                        <p>
                            <strong className="text-foreground">License Validation:</strong>{" "}
                            We collect minimal data for license validation purposes, including
                            your domain name and license key.
                        </p>
                        <p>
                            <strong className="text-foreground">Self-Hosted Data:</strong> All
                            video content, user data, and application data stored on your
                            self-hosted instance is fully under your control. WhatsNxt Private
                            Limited does not have access to data stored on your
                            infrastructure.
                        </p>
                    </div>
                </section>

                {/* Security */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <h2 className="text-2xl font-bold text-foreground">Security</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            As CuratedReels is a self-hosted solution, security of your
                            installation is your responsibility. We recommend:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Using HTTPS for all connections</li>
                            <li>Keeping your installation updated to the latest version</li>
                            <li>Implementing proper access controls</li>
                            <li>Regular backups of your data</li>
                            <li>
                                Following security best practices for your hosting environment
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-card rounded-xl p-8 border border-border">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Questions?
                    </h2>
                    <p className="text-muted-foreground">
                        If you have any questions about this Privacy Policy, please contact
                        us at{" "}
                        <a
                            href="mailto:support@whatsnxt.in"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            support@whatsnxt.in
                        </a>
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
