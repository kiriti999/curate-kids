import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title:
    "CuratedReels | Video Curation Platform for Schools, Parents & Businesses",
  description:
    "Deploy your own branded video curation platform. White-label solution with Telegram bot integration, admin panel, and full customization. Perfect for schools, parents, and businesses.",
  keywords: [
    "video curation",
    "white-label platform",
    "telegram bot",
    "video management",
    "content curation",
    "educational videos",
  ],
  openGraph: {
    title: "CuratedReels | Video Curation Platform",
    description:
      "Deploy your own branded video curation platform with Telegram bot integration and full customization.",
    type: "website",
    siteName: "CuratedReels",
  },
};

export default function Home() {
  return <LandingPage />;
}
