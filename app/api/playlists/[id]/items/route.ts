/**
 * Playlist items API Route
 *
 * POST   { videoId } - Append a video (no-op if already present)
 * DELETE ?videoId=   - Remove a video
 */

import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type Ctx = { params: Promise<{ id: string }> }

const relId = (v: any) => (v && typeof v === 'object' ? v.id : v)

async function loadOwnedItems(req: NextRequest, id: string) {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

    const playlist: any = await payload
        .findByID({ collection: 'playlists', id, depth: 0, overrideAccess: false, user })
        .catch(() => null)
    if (!playlist) return { error: NextResponse.json({ error: 'Playlist not found' }, { status: 404 }) }

    return { payload, user, playlist, videoIds: (playlist.items || []).map((i: any) => relId(i.video)) as string[] }
}

export async function POST(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params
        const { videoId } = await req.json()
        if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 })

        const ctx = await loadOwnedItems(req, id)
        if (ctx.error) return ctx.error

        if (!ctx.videoIds.includes(videoId)) {
            await ctx.payload.update({
                collection: 'playlists',
                id,
                data: { items: [...ctx.videoIds, videoId].map((video) => ({ video })) } as any,
                overrideAccess: false,
                user: ctx.user,
            })
        }
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Error adding to playlist:', error)
        return NextResponse.json({ error: 'Failed to add video' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params
        const videoId = new URL(req.url).searchParams.get('videoId')
        if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 })

        const ctx = await loadOwnedItems(req, id)
        if (ctx.error) return ctx.error

        await ctx.payload.update({
            collection: 'playlists',
            id,
            data: { items: ctx.videoIds.filter((v) => v !== videoId).map((video) => ({ video })) } as any,
            overrideAccess: false,
            user: ctx.user,
        })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Error removing from playlist:', error)
        return NextResponse.json({ error: 'Failed to remove video' }, { status: 500 })
    }
}
