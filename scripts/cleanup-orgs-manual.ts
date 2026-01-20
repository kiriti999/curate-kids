/**
 * Manual Organization Cleanup Script
 * 
 * Lists all organizations and allows you to delete specific ones by name or keep only one.
 * 
 * Usage: 
 *   pnpm cleanup:orgs:manual
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import * as readline from 'readline'

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curatekids'

interface Organization {
    _id: any
    name: string
    telegramGroupId: string
    ownerTelegramId?: string
    createdAt: string
}

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise(resolve => rl.question(query, (answer) => {
        rl.close()
        resolve(answer)
    }))
}

async function manualCleanup() {
    console.log('🧹 Manual Organization Cleanup')
    console.log(`   MongoDB: ${MONGODB_URI}`)
    console.log('')

    const client = new MongoClient(MONGODB_URI)

    try {
        await client.connect()
        console.log('✅ Connected to MongoDB\n')

        const db = client.db()
        const orgsCollection = db.collection('organizations')
        const usersCollection = db.collection('users')

        // Get all organizations
        const organizations = await orgsCollection.find({}).sort({ createdAt: -1 }).toArray() as Organization[]

        if (organizations.length === 0) {
            console.log('✨ No organizations found.')
            return
        }

        console.log(`📋 Found ${organizations.length} organizations:\n`)
        organizations.forEach((org, index) => {
            const date = new Date(org.createdAt).toLocaleString()
            console.log(`${index + 1}. "${org.name}"`)
            console.log(`   Group ID: ${org.telegramGroupId}`)
            console.log(`   Created: ${date}`)
            console.log(`   Database ID: ${org._id}`)
            console.log('')
        })

        const choice = await askQuestion('Which organizations would you like to keep? (enter numbers separated by commas, e.g., "1,5,7" or "all" to keep all): ')

        if (choice.toLowerCase() === 'all') {
            console.log('\n✨ Keeping all organizations. No changes made.')
            return
        }

        const keepIndices = choice.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < organizations.length)

        if (keepIndices.length === 0) {
            console.log('\n❌ No valid indices provided. Exiting.')
            return
        }

        const toKeep = keepIndices.map(i => organizations[i])
        const toDelete = organizations.filter((_, i) => !keepIndices.includes(i))

        console.log(`\n📊 Summary:`)
        console.log(`   Keeping: ${toKeep.length} organization(s)`)
        console.log(`   Deleting: ${toDelete.length} organization(s)\n`)

        if (toDelete.length > 0) {
            console.log('🗑️  Organizations to be deleted:')
            toDelete.forEach((org, index) => {
                console.log(`   ${index + 1}. "${org.name}" (${org.telegramGroupId})`)
            })
            console.log('')

            const confirm = await askQuestion('Are you sure you want to delete these organizations? (yes/no): ')

            if (confirm.toLowerCase() !== 'yes') {
                console.log('\n❌ Cancelled. No changes made.')
                return
            }

            console.log('\n🗑️  Deleting organizations...\n')

            for (const org of toDelete) {
                const orgIdString = org._id.toString()

                // Unlink users from this organization
                const unlinkResult = await usersCollection.updateMany(
                    {
                        $or: [
                            { organization: org._id },
                            { organization: orgIdString },
                            ...(org.ownerTelegramId ? [{ telegramId: org.ownerTelegramId }] : [])
                        ]
                    },
                    {
                        $set: {
                            organization: null,
                            telegramId: null,
                            telegramUsername: null,
                            telegramFirstName: null
                        }
                    }
                )

                console.log(`   📝 Unlinked ${unlinkResult.modifiedCount} user(s) from "${org.name}"`)

                // Delete the organization
                await orgsCollection.deleteOne({ _id: org._id })
                console.log(`   ✅ Deleted "${org.name}"`)
            }

            console.log(`\n✅ Cleanup complete! Deleted ${toDelete.length} organization(s)`)
        }

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    } finally {
        await client.close()
        console.log('\n👋 Disconnected from MongoDB')
    }
}

manualCleanup()
