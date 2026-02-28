/**
 * Terms Acceptance API Route
 * Records customer acceptance of Terms & Conditions before purchase
 */

import config from "@payload-config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, plan, termsAccepted, privacyAccepted } = body;

        // Validate required fields
        if (!name || !email || !plan) {
            return NextResponse.json(
                { error: "Name, email, and plan are required" },
                { status: 400 },
            );
        }

        if (!termsAccepted || !privacyAccepted) {
            return NextResponse.json(
                { error: "Terms and Privacy Policy must be accepted" },
                { status: 400 },
            );
        }

        // Validate plan
        const validPlans = ["starter", "pro", "enterprise"];
        if (!validPlans.includes(plan)) {
            return NextResponse.json(
                { error: "Invalid plan selected" },
                { status: 400 },
            );
        }

        // Get IP address from headers
        const forwardedFor = req.headers.get("x-forwarded-for");
        const ipAddress = forwardedFor
            ? forwardedFor.split(",")[0].trim()
            : "unknown";

        // Get user agent
        const userAgent = req.headers.get("user-agent") || "unknown";

        const payload = await getPayload({ config });

        // Create terms acceptance record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const acceptance = await payload.create({
            collection: "terms-acceptances" as any,
            data: {
                name,
                email,
                plan,
                termsVersion: "1.0",
                acceptedAt: new Date().toISOString(),
                ipAddress,
                userAgent,
                privacyPolicyAccepted: true,
                customDomainInterest: false,
            } as any,
        });

        return NextResponse.json({
            success: true,
            id: acceptance.id,
            message: "Terms acceptance recorded successfully",
        });
    } catch (error) {
        console.error("Terms acceptance error:", error);
        return NextResponse.json(
            { error: "Failed to record terms acceptance" },
            { status: 500 },
        );
    }
}
