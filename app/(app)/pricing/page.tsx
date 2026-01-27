import Pricing from "@/components/Pricing";
import Header from "@/components/Header";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="pt-16">
                <Pricing />
            </div>
        </div>
    );
}
