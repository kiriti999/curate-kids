/**
 * Single Category API Route
 * 
 * DELETE /api/categories/[id] — delete a category (authenticated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await getPayload({ config })

        // Verify authentication
        const { user } = await payload.auth({ headers: req.headers })
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Check if category exists
        let category: any
        try {
            category = await payload.findByID({
                collection: 'categories',
                id,
            })
        } catch {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        // Prevent deleting age range root categories
        if (category.isAgeRangeRoot) {
            return NextResponse.json(
                { error: 'Cannot delete an age range root category' },
                { status: 403 }
            )
        }

        // Check if the category has videos
        const videosInCategory = await payload.find({
            collection: 'videos',
            where: { category: { equals: category.slug } },
            limit: 1,
        })

        if (videosInCategory.docs.length > 0) {
            return NextResponse.json(
                {
                    error: `Cannot delete "${category.name}" — it has ${videosInCategory.totalDocs} video(s). Move or delete them first.`,
                },
                { status: 409 }
            )
        }

        // Delete the category
        await payload.delete({
            collection: 'categories',
            id,
        })

        return NextResponse.json(
            { message: `Category "${category.name}" deleted successfully` },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        )
    }
}
