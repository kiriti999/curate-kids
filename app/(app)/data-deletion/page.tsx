import { Mail, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
    title: "Data Deletion Instructions | CuratedReels",
    description:
        "How to request deletion of your data from CuratedReels, including data linked to a Facebook or Instagram account.",
};

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PageHeader title="Data Deletion" />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <Trash2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Data Deletion Instructions
                    </h1>
                    <p className="text-muted-foreground">
                        How to request deletion of your data from CuratedReels
                    </p>
                </div>

                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        What we collect
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            CuratedReels uses Meta&apos;s oEmbed service to look up public
                            thumbnail images for Instagram and Facebook video links that
                            users submit. We do not request access to your Facebook or
                            Instagram account, and we do not store your Meta login details,
                            friends list, or private posts.
                        </p>
                        <p>
                            Video links and their thumbnails submitted through the platform
                            are stored on the CuratedReels instance that holds them. For
                            self-hosted installations, that instance is controlled by the
                            organization that runs it.
                        </p>
                    </div>
                </section>

                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        How to request deletion
                    </h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            To request deletion of data linked to your Facebook or Instagram
                            account, email{" "}
                            <a
                                href="mailto:support@whatsnxt.in?subject=Data%20deletion%20request"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                support@whatsnxt.in
                            </a>{" "}
                            with the subject line &quot;Data deletion request&quot; and
                            include:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>The Instagram or Facebook username or profile link</li>
                            <li>The video links you submitted, if you know them</li>
                            <li>The name of the CuratedReels instance, if you know it</li>
                        </ul>
                        <p>
                            We will confirm receipt and delete the matching records within 30
                            days, then reply to confirm.
                        </p>
                    </div>
                </section>

                <section className="bg-card rounded-xl p-8 border border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-bold text-foreground">Contact</h2>
                    </div>
                    <p className="text-muted-foreground">
                        Questions about data deletion can be sent to{" "}
                        <a
                            href="mailto:support@whatsnxt.in"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            support@whatsnxt.in
                        </a>
                        . WhatsNxt Private Limited operates CuratedReels.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
}
