import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'

/**
 * Setup endpoint to create initial admin user
 * This endpoint can only be called once - it will fail if users already exist
 */
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })

    // Check if any admin/superadmin users exist (not just any user)
    const existingAdmins = await payload.find({
      collection: 'users',
      where: {
        or: [
          { role: { equals: 'admin' } },
          { role: { equals: 'superadmin' } }
        ]
      },
      limit: 1,
    })

    if (existingAdmins.docs.length > 0) {
      return NextResponse.json(
        { 
          error: 'Setup already completed',
          message: 'Admin user already exists. Please use the login page.'
        },
        { status: 400 }
      )
    }

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@curatedreels.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const adminName = process.env.ADMIN_NAME || 'Admin User'

    console.log(`[Setup API] Creating admin user: ${adminEmail}`)

    // Create admin user
    const user = await payload.create({
      collection: 'users',
      data: {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
        status: 'active',
      },
      draft: false,
    })

    console.log(`[Setup API] ✅ Admin user created: ${user.email} (ID: ${user.id})`)

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error: any) {
    console.error('[Setup API] ❌ Error:', error)
    return NextResponse.json(
      {
        error: 'Setup failed',
        message: error.message || 'Failed to create admin user',
      },
      { status: 500 }
    )
  }
}
