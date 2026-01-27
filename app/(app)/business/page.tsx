import LandingPage from "@/components/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CurateKids for Business | White-Label Video Curation Platform",
  description: "Deploy your own branded video curation platform. White-label solution with Telegram bot integration, admin panel, and full customization. Perfect for businesses and content creators.",
  keywords: ["video curation", "white-label platform", "telegram bot", "video management", "content curation", "business solution"],
  openGraph: {
    title: "CurateKids for Business | White-Label Video Curation Platform",
    description: "Deploy your own branded video curation platform with Telegram bot integration and full customization.",
    type: "website",
    siteName: "CurateKids",
  },
  twitter: {
    card: "summary_large_image",
    title: "CurateKids for Business | White-Label Video Curation Platform",
    description: "Deploy your own branded video curation platform with Telegram bot integration and full customization.",
  },
};

export default function BusinessPage() {
    return <LandingPage />;
}
