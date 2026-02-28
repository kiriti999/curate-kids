/**
 * OTP Store (In-memory)
 * 
 * Shared store for OTP verification.
 * In production, use Redis or database for persistence across serverless instances.
 */

interface OtpData {
    otp: string
    expiresAt: number
    attempts: number
}

// Map of email -> OTP data
export const otpStore = new Map<string, OtpData>()

// Generate 6-digit OTP
export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Clean up expired OTPs
export const cleanupExpiredOtps = () => {
    const now = Date.now()
    for (const [email, data] of otpStore.entries()) {
        if (data.expiresAt < now) {
            otpStore.delete(email)
        }
    }
}

// OTP expiry time (10 minutes)
export const OTP_EXPIRY_MS = 10 * 60 * 1000

// Max verification attempts
export const MAX_ATTEMPTS = 5

// Rate limiting
const RATE_LIMIT_WINDOW = 10 * 60 * 1000 // 10 minutes
const MAX_REQUESTS = 3
const rateLimit = new Map<string, { count: number; windowStart: number }>()

export const checkRateLimit = (email: string): boolean => {
    const now = Date.now()
    const record = rateLimit.get(email)

    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
        rateLimit.set(email, { count: 1, windowStart: now })
        return true
    }

    if (record.count >= MAX_REQUESTS) {
        return false
    }

    record.count++
    return true
}
