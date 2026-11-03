/**
 * Single playlist API Route
 *
 * PATCH  - Update title / description / visibility (owner or staff)
 * DELETE - Delete the playlist (owner or staff)
 */

import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: req.headers })
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const data: Record<string, unknown> = {}
        if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 120)
        if (typeof body.description === 'string') data.description = body.description.slice(0, 500)
        if (typeof body.isPublic === 'boolean') data.isPublic = body.isPublic

        await payload.update({
            collection: 'playlists',
            id,
            data,
            overrideAccess: false,
            user,
        })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Error updating playlist:', error)
        return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: req.headers })
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await payload.delete({ collection: 'playlists', id, overrideAccess: false, user })
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Error deleting playlist:', error)
        return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 })
    }
}
