import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Logo showTagline={false} />
                        <p className="mt-4 text-gray-400 text-sm max-w-md">
                            CuratedReels provides a dedicated platform for schools, parents,
                            and businesses to curate, manage, and share educational video
                            content safely and efficiently.
                        </p>
                        <p className="mt-4 text-gray-500 text-xs">
                            A product of WhatsNxt Private Limited
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/demo"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Live Demo
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/admin-preview"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Admin Preview
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/pricing"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/login"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Sign In
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} WhatsNxt Private Limited. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <Link
                            href="/privacy"
                            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                        >
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
