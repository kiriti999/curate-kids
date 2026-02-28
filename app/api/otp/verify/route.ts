/**
 * OTP Verify API Route
 * Verifies the OTP code sent to the user's email
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cleanupExpiredOtps, MAX_ATTEMPTS, otpStore } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json(
                { error: "Email and OTP are required" },
                { status: 400 },
            );
        }

        // Clean up expired OTPs
        cleanupExpiredOtps();

        const emailLower = email.toLowerCase();
        const otpData = otpStore.get(emailLower);

        // Check if OTP exists
        if (!otpData) {
            return NextResponse.json(
                { error: "OTP expired or not found. Please request a new one." },
                { status: 400 },
            );
        }

        // Check if OTP is expired
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(emailLower);
            return NextResponse.json(
                { error: "OTP expired. Please request a new one." },
                { status: 400 },
            );
        }

        // Check attempts
        if (otpData.attempts >= MAX_ATTEMPTS) {
            otpStore.delete(emailLower);
            return NextResponse.json(
                { error: "Too many failed attempts. Please request a new OTP." },
                { status: 429 },
            );
        }

        // Verify OTP
        if (otpData.otp !== otp.toString().trim()) {
            otpData.attempts++;
            const remainingAttempts = MAX_ATTEMPTS - otpData.attempts;
            return NextResponse.json(
                {
                    error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`,
                    remainingAttempts,
                },
                { status: 400 },
            );
        }

        // OTP is valid - remove it from store
        otpStore.delete(emailLower);

        return NextResponse.json({
            success: true,
            message: "Email verified successfully",
            verified: true,
        });
    } catch (error) {
        console.error("OTP verify error:", error);
        return NextResponse.json(
            { error: "Failed to verify OTP. Please try again." },
            { status: 500 },
        );
    }
}
