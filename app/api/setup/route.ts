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

    // Check if any users already exist
    const existingUsers = await payload.find({
      collection: 'users',
      limit: 1,
    })

    if (existingUsers.docs.length > 0) {
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
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        error: 'Setup failed',
        message: error.message || 'Failed to create admin user',
      },
      { status: 500 }
    )
  }
}
