import {
    BarChart3,
    Edit,
    Eye,
    FolderPlus,
    Grid3X3,
    Link as LinkIcon,
    List,
    Plus,
    Search,
    Settings,
    Tag,
    Trash2,
    Users,
    Video,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import AdminPreviewHeader from "@/components/AdminPreviewHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
    title: "Admin Preview | CuratedReels - Content Management System",
    description:
        "Preview the powerful Payload CMS admin interface. Manage videos, categories, users and more with an intuitive dashboard.",
};

function AdminSidebar() {
    const menuItems = [
        { icon: BarChart3, label: "Dashboard", active: false },
        { icon: Video, label: "Videos", active: true },
        { icon: FolderPlus, label: "Categories", active: false },
        { icon: Tag, label: "Tags", active: false },
        { icon: Users, label: "Users", active: false },
        { icon: Settings, label: "Settings", active: false },
    ];

    return (
        <div className="w-64 bg-gray-900 text-white min-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <span className="text-lg font-bold text-blue-400">
                    CuratedReels Admin
                </span>
            </div>
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            <div
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${item.active
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-300 hover:bg-gray-800"
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        A
                    </div>
                    <div>
                        <p className="text-sm font-medium">Admin User</p>
                        <p className="text-xs text-gray-400">admin@school.edu</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VideoRow({
    title,
    category,
    views,
    status,
}: {
    title: string;
    category: string;
    views: string;
    status: "published" | "draft";
}) {
    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <Video className="h-6 w-6 text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {title}
                    </span>
                </div>
            </td>
            <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{category}</td>
            <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{views}</td>
            <td className="py-4 px-4">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${status === "published"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                >
                    {status}
                </span>
            </td>
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function AdminMainContent() {
    const sampleVideos = [
        {
            title: "Introduction to Fractions",
            category: "Mathematics",
            views: "1,234",
            status: "published" as const,
        },
        {
            title: "Solar System Exploration",
            category: "Science",
            views: "987",
            status: "published" as const,
        },
        {
            title: "Story Time: The Little Prince",
            category: "Language Arts",
            views: "756",
            status: "published" as const,
        },
        {
            title: "Basic Coding Concepts",
            category: "Technology",
            views: "543",
            status: "draft" as const,
        },
        {
            title: "World Geography Quiz",
            category: "Social Studies",
            views: "321",
            status: "published" as const,
        },
    ];

    return (
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Videos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your curated video library
                    </p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Video
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[250px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search videos..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>All Categories</option>
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>Language Arts</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>All Status</option>
                        <option>Published</option>
                        <option>Draft</option>
                    </select>
                    <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <button type="button" className="p-2 bg-blue-600 text-white">
                            <Grid3X3 className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            className="p-2 bg-white dark:bg-gray-700 text-gray-500"
                        >
                            <List className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Videos Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                Video
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                Category
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                Views
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                Status
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleVideos.map((video, index) => (
                            <VideoRow key={index} {...video} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing 1-5 of 24 videos
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        1
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        2
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
        </div>
    );
}

export default function AdminPreviewPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Preview Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            Admin Panel Preview - This is how you&apos;ll manage your content
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
            <AdminPreviewHeader />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Introduction */}
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                        Powerful Content Management
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        CuratedReels comes with Payload CMS, a powerful headless CMS that
                        lets you manage videos, categories, users, and more with an
                        intuitive admin interface.
                    </p>
                </div>

                {/* Admin Panel Preview */}
                <div className="mb-12">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-t-xl px-4 py-2 flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                your-school.curatedreels.com/admin
                            </span>
                        </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-xl overflow-hidden">
                        <div className="flex">
                            <AdminSidebar />
                            <AdminMainContent />
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                        Admin Capabilities
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Video}
                            title="Video Management"
                            description="Add videos via YouTube/Vimeo links or Telegram bot. Organize with custom thumbnails and descriptions."
                        />
                        <FeatureCard
                            icon={FolderPlus}
                            title="Custom Categories"
                            description="Create unlimited categories to organize content by subject, grade level, or any custom criteria."
                        />
                        <FeatureCard
                            icon={Tag}
                            title="Tagging System"
                            description="Add tags to videos for better searchability and create smart collections based on tags."
                        />
                        <FeatureCard
                            icon={Users}
                            title="User Management"
                            description="Invite team members, set permissions, and manage access levels for your content editors."
                        />
                        <FeatureCard
                            icon={LinkIcon}
                            title="Telegram Integration"
                            description="Simply forward YouTube links to your Telegram bot and videos are auto-added to your library."
                        />
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">
                        Ready to Manage Your Own Video Library?
                    </h2>
                    <p className="text-blue-100 mb-6 max-w-xl mx-auto">
                        Get your own CuratedReels instance with full admin access. Deploy in
                        minutes and start curating content today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/pricing"
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-medium rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            View Pricing
                        </Link>
                        <Link
                            href="/demo"
                            className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                        >
                            See Video Gallery Demo
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
