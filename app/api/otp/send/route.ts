/**
 * OTP Send API Route
 * Sends a 6-digit OTP to the provided email address for verification
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
    checkRateLimit,
    cleanupExpiredOtps,
    generateOtp,
    OTP_EXPIRY_MS,
    otpStore,
} from "@/lib/otp-store";

export async function POST(req: NextRequest) {
    try {
        const { email, name } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 },
            );
        }

        // Check rate limit
        if (!checkRateLimit(email.toLowerCase())) {
            return NextResponse.json(
                { error: "Too many OTP requests. Please try again in 10 minutes." },
                { status: 429 },
            );
        }

        // Clean up expired OTPs
        cleanupExpiredOtps();

        // Generate OTP
        const otp = generateOtp();
        const expiresAt = Date.now() + OTP_EXPIRY_MS;

        // Store OTP
        otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 });

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Send email
        await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || "CuratedReels"}" <${process.env.SMTP_FROM_EMAIL || "noreply@curatedreels.com"}>`,
            to: email,
            subject: "Verify your email - CuratedReels",
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">🎬 CuratedReels</h1>
            </div>
            
            <h2 style="color: #333; font-size: 20px; margin-bottom: 16px;">Verify Your Email</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hi${name ? ` ${name}` : ""},
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Your verification code is:
            </p>
            
            <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: white;">${otp}</span>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5;">
              This code expires in <strong>10 minutes</strong>.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
        });

        return NextResponse.json({
            success: true,
            message: "OTP sent successfully",
            expiresIn: OTP_EXPIRY_MS / 1000, // seconds
        });
    } catch (error) {
        console.error("OTP send error:", error);
        return NextResponse.json(
            { error: "Failed to send OTP. Please try again." },
            { status: 500 },
        );
    }
}
