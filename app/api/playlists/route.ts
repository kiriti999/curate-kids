/**
 * Playlists API Route
 *
 * GET  - List the current user's playlists (with video ids for membership checks)
 * POST - Create a playlist, optionally seeded with one video
 */

import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

const relId = (v: any) => (v && typeof v === 'object' ? v.id : v)

export async function GET(req: NextRequest) {
    try {
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: req.headers })
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const result = await payload.find({
            collection: 'playlists',
            where: { owner: { equals: user.id } },
            sort: '-updatedAt',
            limit: 100,
            depth: 0,
        })

        const playlists = result.docs.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            isPublic: !!p.isPublic,
            videoIds: (p.items || []).map((i: any) => relId(i.video)),
        }))
        return NextResponse.json({ playlists })
    } catch (error) {
        console.error('Error listing playlists:', error)
        return NextResponse.json({ error: 'Failed to list playlists' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: req.headers })
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { title, description, isPublic, videoId } = await req.json()
        if (!title || typeof title !== 'string' || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const playlist: any = await payload.create({
            collection: 'playlists',
            data: {
                title: title.trim().slice(0, 120),
                description: typeof description === 'string' ? description.slice(0, 500) : undefined,
                isPublic: !!isPublic,
                owner: user.id,
                organization: relId((user as any).organization) || undefined,
                items: videoId ? [{ video: videoId }] : [],
            } as any,
            overrideAccess: false,
            user,
        })

        return NextResponse.json(
            {
                playlist: {
                    id: playlist.id,
                    title: playlist.title,
                    slug: playlist.slug,
                    isPublic: !!playlist.isPublic,
                    videoIds: videoId ? [videoId] : [],
                },
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('Error creating playlist:', error)
        return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 })
    }
}
