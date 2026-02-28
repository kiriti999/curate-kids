import {
    AlertCircle,
    CreditCard,
    FileText,
    Globe,
    HeadphonesIcon,
    Server,
    Shield,
} from "lucide-react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
    title: "Terms & Conditions | CuratedReels",
    description:
        "Terms and conditions for using CuratedReels video curation platform. Understand your responsibilities and our policies.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PageHeader title="Terms & Conditions" />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Terms & Conditions
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated:{" "}
                        {new Date().toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>

                {/* Introduction */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Agreement to Terms
                    </h2>
                    <p className="text-muted-foreground">
                        By purchasing a license and using CuratedReels, you agree to be
                        bound by these Terms and Conditions. CuratedReels is a product of
                        WhatsNxt Private Limited (&quot;Company&quot;, &quot;we&quot;,
                        &quot;our&quot;). These terms govern your use of our software and
                        services.
                    </p>
                </section>

                {/* Content Liability */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Content Liability
                        </h2>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <p className="text-red-800 dark:text-red-200 mb-4 font-medium">
                            Important Disclaimer
                        </p>
                        <ul className="text-red-700 dark:text-red-300 space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>
                                    <strong>
                                        The Company is not responsible for any liability
                                    </strong>{" "}
                                    if the customer shares private, personal, or inappropriate
                                    videos through their CuratedReels installation.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>
                                    You are solely responsible for the content you upload, share,
                                    or distribute through your self-hosted installation.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>
                                    Any legal issues arising from content shared through your
                                    installation are your responsibility, not the Company&apos;s.
                                </span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Infrastructure Responsibility */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Infrastructure Responsibility
                        </h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            CuratedReels is a self-hosted solution. As the customer, you are
                            responsible for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Setting up and maintaining your hosting infrastructure</li>
                            <li>Server security, updates, and patches</li>
                            <li>Database backups and data integrity</li>
                            <li>Network security and access controls</li>
                            <li>Compliance with local laws and regulations</li>
                        </ul>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                <strong>Note:</strong> The Company is not liable for any issues
                                arising from infrastructure misuse, security breaches, or data
                                loss on your self-hosted installation. You are fully responsible
                                for the security and privacy of your setup and infrastructure.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Security & Privacy Responsibility */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Security & Privacy
                        </h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                        <p>You, the customer, are solely responsible for:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>
                                Implementing proper security measures for your installation
                            </li>
                            <li>Protecting user data and ensuring privacy compliance</li>
                            <li>Securing access credentials and API keys</li>
                            <li>Monitoring and responding to security incidents</li>
                            <li>
                                Compliance with GDPR, CCPA, or other applicable privacy
                                regulations
                            </li>
                        </ul>
                        <p className="mt-4">
                            The Company provides the software as-is and does not guarantee
                            security of customer deployments. Any privacy or security issues
                            arising from your deployment are your responsibility.
                        </p>
                    </div>
                </section>

                {/* Support Policy */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <HeadphonesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Support Policy
                        </h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                        <p>Support is available under the following terms:</p>
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <h4 className="font-bold text-foreground mb-2">
                                    Basic Support (Included)
                                </h4>
                                <ul className="text-sm space-y-1">
                                    <li>• License activation assistance</li>
                                    <li>• Basic setup documentation</li>
                                    <li>• Email support (48hr response)</li>
                                </ul>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                <h4 className="font-bold text-foreground mb-2">
                                    Premium Support (Paid)
                                </h4>
                                <ul className="text-sm space-y-1">
                                    <li>• Priority response times</li>
                                    <li>• Technical troubleshooting</li>
                                    <li>• Infrastructure guidance</li>
                                    <li>• Custom implementation help</li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-sm mt-4">
                            Premium support is available through our premium plan subscription
                            or as one-off paid support charges. Contact us for pricing
                            details.
                        </p>
                    </div>
                </section>

                {/* Refund Policy */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Refund Policy
                        </h2>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
                        <p className="text-orange-800 dark:text-orange-200 font-medium mb-2">
                            No Refunds
                        </p>
                        <p className="text-orange-700 dark:text-orange-300 text-sm">
                            All license purchases are final. Due to the digital nature of our
                            product and immediate access to the software upon purchase, we do
                            not offer refunds under any circumstances. Please ensure you have
                            reviewed the demo and documentation before making a purchase.
                        </p>
                    </div>
                </section>

                {/* Custom Domain */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-2xl font-bold text-foreground">
                            Custom Domain
                        </h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            By default, your CuratedReels installation will be hosted on a
                            Vercel-provided subdomain (e.g., <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">yourproject.vercel.app</code>).
                        </p>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                            <p className="text-indigo-800 dark:text-indigo-200 font-medium mb-2">
                                Custom Domain Add-on
                            </p>
                            <ul className="text-indigo-700 dark:text-indigo-300 text-sm space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    <span>
                                        Custom domains (e.g., <code className="bg-indigo-100 dark:bg-indigo-800 px-1 rounded">videos.yourbrand.com</code>) are <strong>available as a paid add-on</strong>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    <span>
                                        You are responsible for purchasing and maintaining your own domain
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    <span>
                                        DNS configuration and SSL certificates will be handled during setup
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">•</span>
                                    <span>
                                        Contact support for custom domain pricing and setup assistance
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* License Terms */}
                <section className="bg-card rounded-xl p-8 border border-border mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        License Terms
                    </h2>
                    <ul className="text-muted-foreground space-y-3">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>Each license is valid for one production domain only</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>Licenses are non-transferable without written consent</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>
                                Source code modification is permitted for self-hosted use
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>
                                Redistribution or resale of the software is prohibited
                            </span>
                        </li>
                    </ul>
                </section>

                {/* Contact */}
                <section className="bg-card rounded-xl p-8 border border-border">
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Questions?
                    </h2>
                    <p className="text-muted-foreground">
                        If you have any questions about these Terms and Conditions, please
                        contact us at{" "}
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
