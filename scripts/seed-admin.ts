/**
 * Seed Admin User Script
 * 
 * Creates the first admin user if no users exist in the database.
 * Usage: pnpm seed:admin
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load .env.local to override .env for local development (only if not in production)
if (process.env.NODE_ENV !== 'production') {
  const envLocalPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
    for (const k in envConfig) {
      process.env[k] = envConfig[k]
    }
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@curatekids.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User'
const API_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

async function seedAdmin() {
  console.log('🌱 Seeding admin user...')
  console.log(`   API URL: ${API_URL}`)
  console.log(`   Admin Email: ${ADMIN_EMAIL}`)

  try {
    // Check if already initialized
    const initResponse = await fetch(`${API_URL}/api/users/init`)
    const initData = await initResponse.json()

    if (initData.initialized) {
      console.log('✅ Database already has users. Skipping seed.')
      console.log('   To reset, drop the users collection and run again.')
      return
    }

    console.log('📝 Creating first admin user...')

    // Create first user via first-register endpoint
    const registerResponse = await fetch(`${API_URL}/api/users/first-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      }),
    })

    const registerData = await registerResponse.json()

    if (registerResponse.ok) {
      console.log('✅ Admin user created successfully!')
      console.log(`   Email: ${registerData.user.email}`)
      console.log(`   Name: ${registerData.user.name}`)
      console.log(`   Role: ${registerData.user.role}`)
      console.log('')
      console.log('🔐 Login credentials:')
      console.log(`   Email: ${ADMIN_EMAIL}`)
      console.log(`   Password: ${ADMIN_PASSWORD}`)
      console.log('')
      console.log('🌐 Admin panel: http://localhost:3000/admin')
    } else {
      console.error('❌ Failed to create admin user:')
      console.error(JSON.stringify(registerData, null, 2))
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:')
    console.error(error)
    console.log('')
    console.log('💡 Make sure the dev server is running: pnpm dev')
    process.exit(1)
  }
}

seedAdmin()
