/**
 * Check Telegram Link Status API Endpoint
 * 
 * GET /api/users/check-telegram?tg=telegramId
 * Checks if a Telegram ID is already linked to a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '../../../../payload.config'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const telegramId = searchParams.get('tg')

        if (!telegramId) {
            return NextResponse.json({ linked: false, message: 'No Telegram ID provided' })
        }

        const payload = await getPayload({ config: configPromise })

        // Check if any user has this Telegram ID
        const users = await payload.find({
            collection: 'users',
            where: {
                telegramId: { equals: telegramId },
            },
            limit: 1,
        })

        if (users.docs.length > 0) {
            const user = users.docs[0]
            return NextResponse.json({
                linked: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    telegramUsername: user.telegramUsername,
                },
                message: 'This Telegram account is already linked',
            })
        }

        return NextResponse.json({
            linked: false,
            message: 'Telegram account not linked yet',
        })
    } catch (error) {
        console.error('Error checking Telegram link status:', error)
        return NextResponse.json({ linked: false, error: 'Failed to check status' }, { status: 500 })
    }
}
