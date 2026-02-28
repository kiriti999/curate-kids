import {
    ArrowRight,
    Baby,
    Briefcase,
    CheckCircle,
    Cloud,
    Cpu,
    Database,
    Globe,
    Hash,
    MessageCircle,
    Play,
    School,
    Send,
    Server,
    Settings,
    Share2,
    ShieldCheck,
    Upload,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";
import Footer from "./Footer";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/">
                            <Logo
                                showTagline={false}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/demo"
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hidden sm:block"
                        >
                            Live Demo
                        </Link>
                        <Link
                            href="/admin-preview"
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hidden sm:block"
                        >
                            Admin Preview
                        </Link>
                        <Link
                            href="/pricing"
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hidden sm:block"
                        >
                            Pricing
                        </Link>
                        <ThemeToggle />
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-white dark:bg-gray-900 pt-24 pb-20 lg:pt-32 lg:pb-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
                            Empower Learning with{" "}
                            <span className="text-blue-600 dark:text-blue-400">Curated Content</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                            CuratedReels provides a dedicated platform for schools, parents,
                            and businesses to curate, manage, and share educational video
                            content safely and efficiently.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/pricing"
                                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 md:text-xl transition-colors shadow-lg hover:shadow-xl"
                            >
                                View Pricing <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                href="/demo"
                                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 md:text-xl transition-colors shadow-lg hover:shadow-xl"
                            >
                                Live Demo <Play className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                href="/admin-preview"
                                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 md:text-xl transition-colors shadow-lg hover:shadow-xl"
                            >
                                Admin Preview <Settings className="ml-2 h-5 w-5" />
                            </Link>
                            <Link
                                href="#use-cases"
                                className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-lg font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 md:text-xl transition-colors"
                            >
                                Explore Use Cases
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section id="use-cases" className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
                            Tailored for Every Need
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Whether you are an educator, a parent, or a corporate trainer,
                            CuratedReels adapts to your specific content curation
                            requirements.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {/* Schools */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-100 dark:border-gray-700">
                            <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                                <School size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Schools & Educators
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Create a safe digital library for students. Curate educational
                                videos aligned with your curriculum without the distractions of
                                open platforms.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Subject-specific playlists
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Share activities via secure links
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Student submission curation
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Parents */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-100 dark:border-gray-700">
                            <div className="h-14 w-14 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center mb-6 text-pink-600 dark:text-pink-400">
                                <Baby size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Parents & Guardians
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Build a personalized learning environment. Collect and organize
                                videos for hobbies, skills, and schoolwork in one ad-free space.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Safe viewing environment
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Organize by interest or age
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Easy sharing with family
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Businesses */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-100 dark:border-gray-700">
                            <div className="h-14 w-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                                <Briefcase size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Businesses & Training
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Streamline internal training and knowledge sharing. Curate
                                industry news, tutorials, and internal demos for your teams.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Onboarding video libraries
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Skill development tracks
                                    </span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Secure internal distribution
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Telegram Workflow - Unique Value Proposition */}
            <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDE0di0yaDIyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                            <Send className="h-5 w-5" />
                            <span className="text-sm font-medium">Powered by Telegram</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Post Videos from Telegram. See Them on Your Website.
                        </h2>
                        <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                            No complex admin panels needed. Your team shares videos to a Telegram channel,
                            and they automatically appear on your curated website. It&apos;s that simple.
                        </p>
                    </div>

                    {/* How It Works Steps */}
                    <div className="grid md:grid-cols-4 gap-6 mb-16">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center relative">
                            <div className="absolute -top-3 -left-3 h-10 w-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                1
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Send className="h-8 w-8" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">Share to Channel</h4>
                            <p className="text-blue-100 text-sm">
                                Post a video or YouTube link to your private Telegram channel
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center relative">
                            <div className="absolute -top-3 -left-3 h-10 w-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                2
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Hash className="h-8 w-8" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">Tag Category</h4>
                            <p className="text-blue-100 text-sm">
                                Use hashtags like #Science or #Music to categorize automatically
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center relative">
                            <div className="absolute -top-3 -left-3 h-10 w-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                3
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Cloud className="h-8 w-8" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">Auto CDN Upload</h4>
                            <p className="text-blue-100 text-sm">
                                Raw videos are uploaded to your private cloud CDN securely
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center relative">
                            <div className="absolute -top-3 -left-3 h-10 w-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                4
                            </div>
                            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Globe className="h-8 w-8" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">Live on Website</h4>
                            <p className="text-blue-100 text-sm">
                                Video appears instantly in your curated library for viewers
                            </p>
                        </div>
                    </div>

                    {/* Benefits Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                            <Users className="h-10 w-10 mb-4 text-yellow-300" />
                            <h4 className="font-bold text-xl mb-2">Team Collaboration</h4>
                            <p className="text-blue-100">
                                Multiple teachers, parents, or team members can post to the same channel.
                                Everyone contributes, one unified library.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                            <MessageCircle className="h-10 w-10 mb-4 text-green-300" />
                            <h4 className="font-bold text-xl mb-2">No Learning Curve</h4>
                            <p className="text-blue-100">
                                If you can use Telegram, you can manage your video library.
                                No training needed, no complex dashboards to learn.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                            <Upload className="h-10 w-10 mb-4 text-pink-300" />
                            <h4 className="font-bold text-xl mb-2">Direct Video Upload</h4>
                            <p className="text-blue-100">
                                Upload raw videos directly to Telegram. They get processed
                                and hosted on your private CDN automatically.
                            </p>
                        </div>
                    </div>

                    {/* Comparison */}
                    <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                        <h3 className="text-2xl font-bold text-center mb-8">
                            Why This is Different
                        </h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-lg mb-4 text-red-300">❌ Traditional Platforms</h4>
                                <ul className="space-y-3 text-blue-100">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-300 mt-1">•</span>
                                        Log into dashboard, navigate menus, upload videos
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-300 mt-1">•</span>
                                        Each user needs admin access and training
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-300 mt-1">•</span>
                                        Complex workflows slow team down
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-300 mt-1">•</span>
                                        Mobile uploads are clunky experience
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-4 text-green-300">✓ CuratedReels + Telegram</h4>
                                <ul className="space-y-3 text-blue-100">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-300 mt-1">•</span>
                                        Share to channel from phone in seconds
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-300 mt-1">•</span>
                                        Just add team to channel - that&apos;s it
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-300 mt-1">•</span>
                                        Natural workflow everyone already knows
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-300 mt-1">•</span>
                                        Best-in-class mobile experience via Telegram
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Platform Features
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Everything you need to manage your video content workflow
                            effectively.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <Globe className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Centralized Hub</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                All your curated content in one searchable, organized location.
                            </p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <Share2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Easy Sharing</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Share single videos or entire playlists with a simple link.
                            </p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <ShieldCheck className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Content Safety</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Review and approve content before it reaches your audience.
                            </p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <Zap className="h-10 w-10 text-yellow-600 dark:text-yellow-400 mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fast Deployment</h4>
                            <p className="text-gray-600 dark:text-gray-400">
                                Get your instance running quickly with our deployment tools.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pre-requisites Section */}
            <section className="py-20 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">
                                Technical Pre-requisites
                            </h2>
                            <p className="text-xl text-gray-300 mb-8">
                                CuratedReels is designed to be self-hosted or deployed on your
                                preferred cloud infrastructure. Here's what you need to get
                                started.
                            </p>

                            <div className="space-y-6">
                                <div className="flex">
                                    <Server className="h-8 w-8 text-blue-400 mr-4 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">
                                            Server Requirements
                                        </h4>
                                        <p className="text-gray-400">
                                            Environment (Vercel and Deno).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex">
                                    <Database className="h-8 w-8 text-purple-400 mr-4 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">Database</h4>
                                        <p className="text-gray-400">
                                            MongoDB database (Atlas or self-hosted) for storing
                                            curation metadata.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex">
                                    <Cpu className="h-8 w-8 text-green-400 mr-4 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">
                                            Telegram Bot (Optional)
                                        </h4>
                                        <p className="text-gray-400">
                                            A Telegram bot token is required if you want to use the
                                            Telegram ingestion workflow.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-sm text-gray-400 italic">
                                        All accounts can be free-tier and can be scaled later if
                                        required usually after a year.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <code className="text-sm font-mono text-green-400">
                                    npm install -g @curatedreels/deploy-cli
                                    <br />
                                    curatedreels-deploy init
                                </code>
                            </div>
                        </div>

                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
                            <h3 className="text-2xl font-bold mb-6">Simple Setup</h3>
                            <ol className="space-y-4 relative border-l border-gray-700 ml-3">
                                <li className="mb-10 ml-6">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full -left-4 ring-4 ring-gray-900 text-sm font-bold">
                                        1
                                    </span>
                                    <h4 className="font-medium leading-tight text-lg">
                                        Get Your License
                                    </h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Purchase a license key to unlock your own private
                                        CuratedReels platform.
                                    </p>
                                </li>
                                <li className="mb-10 ml-6">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full -left-4 ring-4 ring-gray-900 text-sm font-bold">
                                        2
                                    </span>
                                    <h4 className="font-medium leading-tight text-lg">
                                        Create Free Accounts
                                    </h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Sign up for free accounts on Vercel and MongoDB to host your
                                        data securely.
                                    </p>
                                </li>
                                <li className="mb-10 ml-6">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full -left-4 ring-4 ring-gray-900 text-sm font-bold">
                                        3
                                    </span>
                                    <h4 className="font-medium leading-tight text-lg">
                                        Auto-Deploy
                                    </h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Run our simple "Magic Command" to build and launch your site
                                        instantly.
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full -left-4 ring-4 ring-gray-900 text-sm font-bold">
                                        4
                                    </span>
                                    <h4 className="font-medium leading-tight text-lg">
                                        Start Curating
                                    </h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Log in, invite your team, and start organizing content
                                        immediately.
                                    </p>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white mb-6">
                        Ready to Start Curating?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Join hundreds of schools and organizations creating better digital
                        learning experiences.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/pricing"
                            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-lg"
                        >
                            Get Your License
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center px-8 py-4 border border-blue-400 text-lg font-medium rounded-xl text-white hover:bg-blue-700 transition-colors"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
