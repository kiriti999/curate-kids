/**
 * Link Telegram Account API Endpoint
 * 
 * POST /api/users/link-telegram
 * Links a Telegram account to the currently authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '../../../../payload.config'

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayload({ config: configPromise })

        // Get the current user from the request
        const { user } = await payload.auth({ headers: request.headers })

        if (!user) {
            return NextResponse.json(
                { message: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { telegramId, telegramUsername, telegramFirstName, groupId, role } = body

        if (!telegramId) {
            return NextResponse.json(
                { message: 'Telegram ID is required' },
                { status: 400 }
            )
        }

        // Check if this Telegram ID is already linked to another account
        const existingUser = await payload.find({
            collection: 'users',
            where: {
                telegramId: { equals: telegramId },
                id: { not_equals: user.id },
            },
            limit: 1,
        })

        if (existingUser.docs.length > 0) {
            return NextResponse.json(
                { message: 'This Telegram account is already linked to another user' },
                { status: 400 }
            )
        }

        // Find the organization by group ID
        let organizationId: string | null = null
        if (groupId) {
            const org = await payload.find({
                collection: 'organizations',
                where: {
                    telegramGroupId: { equals: groupId },
                },
                limit: 1,
            })

            if (org.docs.length > 0) {
                organizationId = org.docs[0].id

                // If this user is the owner, update the organization
                const organization = org.docs[0] as any
                if (organization.ownerTelegramId === telegramId) {
                    await payload.update({
                        collection: 'organizations',
                        id: organizationId,
                        data: {
                            owner: user.id,
                            memberCount: (organization.memberCount || 0) + 1,
                            ageRange: undefined, // Clear age range (no longer used)
                        },
                    })
                } else {
                    // Just increment member count
                    await payload.update({
                        collection: 'organizations',
                        id: organizationId,
                        data: {
                            memberCount: (organization.memberCount || 0) + 1,
                            ageRange: undefined, // Clear age range (no longer used)
                        },
                    })
                }
            }
        }

        // Determine the user's role
        // Only set role if:
        // 1. User doesn't have a role yet (new user)
        // 2. User is becoming an admin (owner of org) - this should be allowed
        const currentUser = user as any
        let shouldUpdateRole = false
        let userRole = currentUser.role || 'contributor'

        if (organizationId) {
            const org = await payload.findByID({
                collection: 'organizations',
                id: organizationId,
            })
            // If they're the organization owner and not already admin, upgrade them
            if ((org as any).ownerTelegramId === telegramId) {
                userRole = 'admin'
                // Only update role if it's actually changing to admin
                shouldUpdateRole = currentUser.role !== 'admin'
            }
        }

        // Build update data - only include role if we should update it
        const updateData: any = {
            telegramId,
            telegramUsername: telegramUsername || undefined,
            telegramFirstName: telegramFirstName || undefined,
            telegramLinkedAt: new Date().toISOString(),
            organization: organizationId || undefined,
        }

        // Only include role if the user doesn't have one yet
        // (to avoid triggering the hook that prevents role changes)
        if (!currentUser.role || shouldUpdateRole) {
            updateData.role = userRole
        }

        // Update the user with Telegram info
        await payload.update({
            collection: 'users',
            id: user.id,
            data: updateData,
        })

        return NextResponse.json({
            success: true,
            message: 'Telegram account linked successfully',
            user: {
                id: user.id,
                telegramId,
                organization: organizationId,
                role: userRole,
            },
        })
    } catch (error) {
        console.error('Error linking Telegram account:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
