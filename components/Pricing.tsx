"use client";

import { Check, ExternalLink, Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const plans = [
    {
        tier: "starter",
        title: "Starter",
        price: 4999,
        description: "Perfect for single deployments",
        features: [
            "1 Deployment License",
            "Standard Support",
            "Lifetime Validity",
            "Basic Updates",
        ],
        highlight: false,
    },
    {
        tier: "pro",
        title: "Pro",
        price: 14999,
        description: "Best for growing agencies",
        features: [
            "3 Deployment Licenses",
            "Priority Support",
            "Lifetime Validity",
            "Advanced features"
        ],
        highlight: true,
    },
    {
        tier: "enterprise",
        title: "Enterprise",
        price: 49999,
        description: "For large scale needs",
        features: [
            "Dedicated Support",
            "Lifetime Validity",
            "Custom Branding",
        ],
        highlight: false,
    },
];

export default function Pricing() {
    const [loading, setLoading] = useState<string | null>(null);
    const [customerDetails, setCustomerDetails] = useState({
        name: "",
        email: "",
    });
    const [showModal, setShowModal] = useState<string | null>(null); // tier name
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // OTP verification state
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    const getPaymentUrl = () => {
        if (typeof window === "undefined")
            return "https://www.whatsnxt.in/curatedreels/pricing";
        const isLocal =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
        return isLocal
            ? "http://localhost:3001/curatedreels/pricing"
            : "https://www.whatsnxt.in/curatedreels/pricing";
    };

    const handleBuyClick = (tier: string) => {
        setShowModal(tier);
        setMessage(null);
        setTermsAccepted(false);
        setPrivacyAccepted(false);
        setOtpSent(false);
        setOtpCode("");
        setEmailVerified(false);
    };

    // Send OTP to email
    const sendOtp = async () => {
        if (!customerDetails.name || !customerDetails.email) {
            setMessage({ type: "error", text: "Please enter your name and email" });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerDetails.email)) {
            setMessage({ type: "error", text: "Please enter a valid email address" });
            return;
        }

        setOtpLoading(true);
        setMessage(null);

        try {
            const response = await fetch("/api/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: customerDetails.email,
                    name: customerDetails.name,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send OTP");
            }

            setOtpSent(true);
            setMessage({
                type: "success",
                text: `Verification code sent to ${customerDetails.email}`,
            });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Failed to send OTP",
            });
        } finally {
            setOtpLoading(false);
        }
    };

    // Verify OTP
    const verifyOtp = async () => {
        if (!otpCode || otpCode.length !== 6) {
            setMessage({ type: "error", text: "Please enter the 6-digit code" });
            return;
        }

        setOtpLoading(true);
        setMessage(null);

        try {
            const response = await fetch("/api/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: customerDetails.email,
                    otp: otpCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Invalid OTP");
            }

            setEmailVerified(true);
            setMessage({
                type: "success",
                text: "Email verified successfully!",
            });
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Invalid OTP",
            });
        } finally {
            setOtpLoading(false);
        }
    };

    const initiatePurchase = async (tier: string) => {
        if (!customerDetails.name || !customerDetails.email) {
            setMessage({ type: "error", text: "Please enter your name and email" });
            return;
        }

        if (!termsAccepted || !privacyAccepted) {
            setMessage({ type: "error", text: "Please accept Terms & Conditions and Privacy Policy to continue" });
            return;
        }

        setLoading(tier);
        setMessage(null);

        try {
            // Save terms acceptance to database
            const acceptanceResponse = await fetch("/api/terms-acceptance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: customerDetails.name,
                    email: customerDetails.email,
                    plan: tier,
                    termsAccepted,
                    privacyAccepted,
                }),
            });

            if (!acceptanceResponse.ok) {
                throw new Error("Failed to record acceptance");
            }

            // Build external payment URL with query parameters
            const baseUrl = getPaymentUrl();
            const params = new URLSearchParams({
                tier,
                name: customerDetails.name,
                email: customerDetails.email,
            });

            // Redirect to external payment page
            window.location.href = `${baseUrl}?${params.toString()}`;
        } catch {
            setMessage({ type: "error", text: "Something went wrong. Please try again." });
            setLoading(null);
        }
    };

    return (
        <div className="py-20 bg-gray-50 dark:bg-gray-900" id="pricing">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">
                        CuratedReels Licenses
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Deploy your own white-labeled CuratedReels platform. One-time
                        payment, lifetime license.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card
                            key={plan.tier}
                            className={`flex flex-col relative ${plan.highlight ? "border-blue-600 border-2 shadow-xl scale-105 z-10" : "border-gray-200"}`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                                    <Badge className="bg-blue-600 text-white">POPULAR</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold">
                                    {plan.title}
                                </CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">
                                        ₹{plan.price.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-gray-500 ml-2">/ lifetime</span>
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.highlight ? "default" : "outline"}
                                    onClick={() => handleBuyClick(plan.tier)}
                                >
                                    Buy Now
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                {emailVerified ? "Almost There!" : otpSent ? "Verify Email" : "Enter Details"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(null)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Step 1: Name and Email */}
                            {!emailVerified && (
                                <>
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                                        <Input
                                            id="name"
                                            placeholder="Your Name"
                                            value={customerDetails.name}
                                            onChange={(e) =>
                                                setCustomerDetails({
                                                    ...customerDetails,
                                                    name: e.target.value,
                                                })
                                            }
                                            disabled={otpSent}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                placeholder="your@email.com"
                                                type="email"
                                                value={customerDetails.email}
                                                onChange={(e) =>
                                                    setCustomerDetails({
                                                        ...customerDetails,
                                                        email: e.target.value,
                                                    })
                                                }
                                                disabled={otpSent}
                                            />
                                            {otpSent && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOtpSent(false);
                                                        setOtpCode("");
                                                        setMessage(null);
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline"
                                                >
                                                    Change
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Step 2: OTP Input (shown after OTP sent) */}
                            {otpSent && !emailVerified && (
                                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Mail className="h-4 w-4" />
                                        <span>Enter the 6-digit code sent to <strong>{customerDetails.email}</strong></span>
                                    </div>
                                    <Input
                                        placeholder="Enter 6-digit code"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        className="text-center text-lg tracking-widest"
                                        maxLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={sendOtp}
                                        disabled={otpLoading}
                                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                    >
                                        Didn&apos;t receive code? Resend
                                    </button>
                                </div>
                            )}

                            {/* Step 3: Email Verified Badge + T&C (shown after verification) */}
                            {emailVerified && (
                                <>
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <ShieldCheck className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium text-green-700 dark:text-green-400">Email Verified</p>
                                            <p className="text-xs text-green-600 dark:text-green-500">{customerDetails.email}</p>
                                        </div>
                                    </div>

                                    {/* Terms & Conditions */}
                                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                            Please review and accept:
                                        </p>

                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                I have read and agree to the{" "}
                                                <Link
                                                    href="/terms"
                                                    target="_blank"
                                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                >
                                                    Terms & Conditions
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                                , including the no-refund policy and custom domain add-on pricing.
                                            </span>
                                        </label>

                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacyAccepted}
                                                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                I have read and agree to the{" "}
                                                <Link
                                                    href="/privacy"
                                                    target="_blank"
                                                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                                >
                                                    Privacy Policy
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {message && (
                                <div
                                    className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                                >
                                    {message.text}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!otpSent && !emailVerified && (
                                <Button
                                    className="w-full mt-4"
                                    onClick={sendOtp}
                                    disabled={otpLoading}
                                >
                                    {otpLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Verify Email
                                        </>
                                    )}
                                </Button>
                            )}

                            {otpSent && !emailVerified && (
                                <Button
                                    className="w-full mt-4"
                                    onClick={verifyOtp}
                                    disabled={otpLoading || otpCode.length !== 6}
                                >
                                    {otpLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                            Verify Code
                                        </>
                                    )}
                                </Button>
                            )}

                            {emailVerified && (
                                <Button
                                    className="w-full mt-4"
                                    onClick={() => showModal && initiatePurchase(showModal)}
                                    disabled={loading === showModal || !termsAccepted || !privacyAccepted}
                                >
                                    {loading === showModal ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Proceed to Payment"
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
