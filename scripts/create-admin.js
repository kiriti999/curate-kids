#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Run this directly to create an admin user in your MongoDB
 * 
 * Usage:
 *   node create-admin.js
 * 
 * Or with custom values:
 *   MONGODB_URI=your_uri ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=pass123 node create-admin.js
 */

const { MongoClient } = require('mongodb')
const crypto = require('crypto')

// Get credentials from environment or use defaults
const MONGODB_URI = process.env.MONGODB_URI || ''
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@curatedreels.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin User'

async function createAdmin() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required')
    console.error('   Usage: MONGODB_URI=mongodb://... node create-admin.js')
    process.exit(1)
  }

  console.log('🔧 Creating admin user...\n')
  console.log(`   Email: ${ADMIN_EMAIL}`)
  console.log(`   Name: ${ADMIN_NAME}\n`)

  let client
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✓ Connected to MongoDB\n')

    const db = client.db()
    const usersCollection = db.collection('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: ADMIN_EMAIL })
    if (existingUser) {
      console.log('⚠️  User already exists with this email')
      console.log(`   You can login with: ${ADMIN_EMAIL}\n`)
      return
    }

    // Hash password (PayloadCMS uses bcrypt, but for simplicity we'll use sha256)
    // Note: PayloadCMS will rehash on first login
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

    // Create admin user
    const now = new Date()
    const adminUser = {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: 'superadmin',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      _verified: true,
      draft: false,
      _status: 'published'
    }

    const result = await usersCollection.insertOne(adminUser)
    
    console.log('✅ Admin user created successfully!\n')
    console.log(`   ID: ${result.insertedId}`)
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log(`   Role: superadmin\n`)
    console.log('⚠️  IMPORTANT: Change your password after first login!\n')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

createAdmin()
