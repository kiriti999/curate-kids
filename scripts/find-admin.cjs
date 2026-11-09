#!/usr/bin/env node

/**
 * Find Admin User in MongoDB
 * Checks all databases for the users collection and admin user
 */

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) throw new Error('MONGODB_URI is required')

async function findAdminUser() {
  console.log('🔍 Searching for admin user in MongoDB...\n')

  let client
  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✓ Connected to MongoDB\n')

    // List all databases
    const adminDb = client.db().admin()
    const dbs = await adminDb.listDatabases()
    
    console.log(`Found ${dbs.databases.length} databases:\n`)
    
    for (const dbInfo of dbs.databases) {
      const dbName = dbInfo.name
      
      // Skip system databases
      if (dbName === 'admin' || dbName === 'local' || dbName === 'config') {
        continue
      }
      
      console.log(`📂 Database: ${dbName}`)
      
      const db = client.db(dbName)
      const collections = await db.listCollections().toArray()
      
      // Check if users collection exists
      const usersCollection = collections.find(c => c.name === 'users')
      if (usersCollection) {
        console.log(`   ✓ Has 'users' collection`)
        
        const users = await db.collection('users').find({}).toArray()
        console.log(`   Found ${users.length} user(s):\n`)
        
        users.forEach((user, i) => {
          console.log(`   User ${i + 1}:`)
          console.log(`      ID: ${user._id}`)
          console.log(`      Email: ${user.email}`)
          console.log(`      Name: ${user.name || 'N/A'}`)
          console.log(`      Role: ${user.role || 'N/A'}`)
          console.log(`      Status: ${user.status || 'N/A'}`)
          console.log(`      Created: ${user.createdAt || 'N/A'}`)
          console.log('')
        })
      } else {
        console.log(`   ✗ No 'users' collection`)
      }
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
    }
  }
}

findAdminUser()
