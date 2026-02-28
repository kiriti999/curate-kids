/**
 * Categories API Route
 * 
 * GET  - Fetch all video categories (public)
 * POST - Create a new category (authenticated)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// GET /api/categories — list all VIDEO_CATEGORY_OPTIONS-style categories
export async function GET() {
    try {
        const payload = await getPayload({ config })

        const result = await payload.find({
            collection: 'categories',
            limit: 100,
            sort: 'sortOrder',
            where: {
                isVisible: { equals: true },
            },
        })

        const categories = result.docs.map((cat: any) => ({
            id: cat.id,
            value: cat.slug,
            label: cat.name,
            description: cat.description || '',
            videoCount: cat.videoCount || 0,
            sortOrder: cat.sortOrder || 0,
        }))

        return NextResponse.json({ categories }, { status: 200 })
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}

// POST /api/categories — create a new category
export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config })

        // Verify authentication
        const { user } = await payload.auth({ headers: req.headers })
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { name, description } = body

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Check for duplicate slug
        const existing = await payload.find({
            collection: 'categories',
            where: { slug: { equals: slug } },
            limit: 1,
        })

        if (existing.docs.length > 0) {
            return NextResponse.json(
                { error: `A category with the name "${name}" already exists` },
                { status: 409 }
            )
        }

        // Get the max sortOrder to place new category at the end
        const lastCategory = await payload.find({
            collection: 'categories',
            sort: '-sortOrder',
            limit: 1,
        })
        const nextSortOrder = lastCategory.docs.length > 0
            ? ((lastCategory.docs[0] as any).sortOrder || 0) + 1
            : 0

        const newCategory = await payload.create({
            collection: 'categories',
            data: {
                name: name.trim(),
                slug,
                description: description?.trim() || '',
                depth: 0,
                isVisible: true,
                sortOrder: nextSortOrder,
                childCount: 0,
                videoCount: 0,
            },
        })

        return NextResponse.json(
            {
                category: {
                    id: newCategory.id,
                    value: (newCategory as any).slug,
                    label: (newCategory as any).name,
                    description: (newCategory as any).description || '',
                    videoCount: 0,
                    sortOrder: nextSortOrder,
                },
                message: 'Category created successfully',
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        )
    }
}
