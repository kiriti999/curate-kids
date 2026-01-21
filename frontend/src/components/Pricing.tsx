"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

declare global {
    interface Window {
        Razorpay: any;
    }
}

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
            "Basic Updates"
        ],
        highlight: false
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
            "Advanced features",
            "White-label options"
        ],
        highlight: true
    },
    {
        tier: "enterprise",
        title: "Enterprise",
        price: 49999,
        description: "For large scale needs",
        features: [
            "Unlimited Deployments",
            "Dedicated Support",
            "Lifetime Validity",
            "Custom Branding",
            "SLA"
        ],
        highlight: false
    }
];

export default function Pricing() {
    const [loading, setLoading] = useState<string | null>(null);
    const [customerDetails, setCustomerDetails] = useState({ name: "", email: "" });
    const [showModal, setShowModal] = useState<string | null>(null); // tier name
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Proxy to backend (needs next.config.ts rewrite)
    const API_HOST = "/api/v1";

    const handleBuyClick = (tier: string) => {
        setShowModal(tier);
        setMessage(null);
    };

    const initiatePurchase = async (tier: string) => {
        if (!customerDetails.name || !customerDetails.email) {
            setMessage({ type: 'error', text: "Please enter your name and email" });
            return;
        }

        setLoading(tier);
        setMessage(null);
        const plan = plans.find(p => p.tier === tier);

        try {
            // 1. Initiate Order on Backend
            const response = await fetch(`${API_HOST}/curatekids/orders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: plan?.price,
                    tier: tier,
                    customerDetails
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to create order");
            }

            // 2. Load Razorpay
            if (!window.Razorpay) {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.async = true;
                document.body.appendChild(script);
                await new Promise((resolve) => { script.onload = resolve; });
            }

            // 3. Open Razorpay
            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "CurateKids License",
                description: `${plan?.title} License`,
                order_id: data.order.id,
                prefill: {
                    name: customerDetails.name,
                    email: customerDetails.email
                },
                handler: function (response: any) {
                    setMessage({ type: 'success', text: "Payment Successful! Your license key will be emailed to you shortly." });
                    setTimeout(() => {
                        setShowModal(null);
                        setCustomerDetails({ name: "", email: "" });
                    }, 3000);
                },
                theme: {
                    color: "#2563EB" // Blue-600
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (error: any) {
            console.error("Purchase error:", error);
            setMessage({ type: 'error', text: error.message || "Purchase failed" });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="py-20 bg-gray-50 dark:bg-gray-900" id="pricing">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl mb-4">CurateKids Licenses</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Deploy your own white-labeled CurateKids platform. One-time payment, lifetime license.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card
                            key={plan.tier}
                            className={`flex flex-col relative ${plan.highlight ? 'border-blue-600 border-2 shadow-xl scale-105 z-10' : 'border-gray-200'}`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                                    <Badge className="bg-blue-600 text-white">POPULAR</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">₹{plan.price.toLocaleString("en-IN")}</span>
                                    <span className="text-gray-500 ml-2">/ lifetime</span>
                                </div>
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
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
                            <h3 className="text-xl font-bold">Enter Details</h3>
                            <button
                                onClick={() => setShowModal(null)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    placeholder="Your Name"
                                    value={customerDetails.name}
                                    onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    placeholder="your@email.com"
                                    type="email"
                                    value={customerDetails.email}
                                    onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <Button
                                className="w-full mt-4"
                                onClick={() => showModal && initiatePurchase(showModal)}
                                disabled={loading === showModal}
                            >
                                {loading === showModal ? "Processing..." : "Proceed to Payment"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
