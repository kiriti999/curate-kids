import { Building, Clock, Mail, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
    title: "Contact Us | CuratedReels",
    description:
        "Get in touch with the CuratedReels team. We're here to help with your questions about our video curation platform.",
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PageHeader title="Contact Us" />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Contact Us
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        We&apos;d love to hear from you
                    </p>
                </div>

                {/* Contact Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Email Support
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            For general inquiries and support questions.
                        </p>
                        <a
                            href="mailto:support@whatsnxt.in"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            support@whatsnxt.in
                        </a>
                    </div>

                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                            <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Premium Support
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Priority support for licensed customers on premium plans.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Contact us for premium support options
                        </p>
                    </div>

                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Response Time
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            We typically respond within 24-48 business hours.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Premium support: Same-day response
                        </p>
                    </div>

                    <div className="bg-card rounded-xl p-6 border border-border">
                        <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-4">
                            <Building className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Company</h3>
                        <p className="text-muted-foreground mb-2">
                            WhatsNxt Private Limited
                        </p>
                        <p className="text-sm text-muted-foreground">India</p>
                    </div>
                </div>

                {/* Support Notice */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-12">
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                        Support Policy
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        Free support is limited to license activation and basic setup
                        queries. For ongoing technical support, infrastructure issues, or
                        custom implementations, please consider our premium support plan or
                        one-off paid support options.
                    </p>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <p className="text-muted-foreground mb-6">
                        Looking to get started with CuratedReels?
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        View Pricing
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
