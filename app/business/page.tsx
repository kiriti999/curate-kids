import Link from "next/link";
import { ArrowRight, School, Baby, Briefcase, CheckCircle } from "lucide-react";

export const metadata = {
    title: "CuratedReels for Business",
    description: "White-label video curation platform for schools, parents, and businesses",
};

export default function BusinessPage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            CuratedReels
                        </h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Back to App
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-white pt-24 pb-20 lg:pt-32 lg:pb-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                            Empower Learning with <span className="text-blue-600">Curated Content</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            CuratedReels provides a dedicated platform for schools, parents, and businesses to curate, manage, and share educational video content safely and efficiently.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://whatsnxt.in/curatedreels/pricing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:text-xl transition-colors shadow-lg hover:shadow-xl"
                            >
                                View Pricing <ArrowRight className="ml-2 h-5 w-5" />
                            </a>
                            <Link
                                href="#use-cases"
                                className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:text-xl transition-colors"
                            >
                                Explore Use Cases
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section id="use-cases" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Tailored for Every Need</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Whether you are an educator, a parent, or a corporate trainer, CuratedReels adapts to your specific content curation requirements.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {/* Schools */}
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-100">
                            <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                                <School size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Schools & Educators</h3>
                            <p className="text-gray-600 mb-6">
                                Create a safe digital library for students. Curate educational videos aligned with your curriculum without the distractions of open platforms.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Subject-specific playlists</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Share activities via secure links</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Student submission curation</span>
                                </li>
                            </ul>
                        </div>

                        {/* Parents */}
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-100">
                            <div className="h-14 w-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 text-pink-600">
                                <Baby size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Parents & Guardians</h3>
                            <p className="text-gray-600 mb-6">
                                Build a personalized learning environment. Collect and organize videos for hobbies, skills, and schoolwork in one ad-free space.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Safe viewing environment</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Organize by interest or age</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Easy sharing with family</span>
                                </li>
                            </ul>
                        </div>

                        {/* Businesses */}
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-100">
                            <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                                <Briefcase size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Businesses & Training</h3>
                            <p className="text-gray-600 mb-6">
                                Streamline internal training and knowledge sharing. Curate industry news, tutorials, and internal demos for your teams.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Onboarding video libraries</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Skill development tracks</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">Secure internal distribution</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Curating?</h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Join hundreds of schools and organizations creating better digital learning experiences.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://whatsnxt.in/curatedreels/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-lg"
                        >
                            Get Your License
                        </a>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-4 border border-blue-400 text-lg font-medium rounded-xl text-white hover:bg-blue-700 transition-colors"
                        >
                            Try the App
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
