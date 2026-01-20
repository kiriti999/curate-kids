/**
 * Cleanup Orphaned Organizations Script
 * 
 * Removes organizations from the CMS that are linked to Telegram groups
 * that no longer exist or where the bot is no longer a member.
 * 
 * Usage: pnpm cleanup:orgs [--dry-run]
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

// Load .env.local to override .env for local development
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

// Also load bot's .env.local for TELEGRAM_BOT_TOKEN if not already set
if (!process.env.TELEGRAM_BOT_TOKEN) {
    const botEnvLocalPath = path.resolve(process.cwd(), '../curatekids-bot/.env.local')
    if (fs.existsSync(botEnvLocalPath)) {
        const botEnvConfig = dotenv.parse(fs.readFileSync(botEnvLocalPath))
        if (botEnvConfig.TELEGRAM_BOT_TOKEN) {
            process.env.TELEGRAM_BOT_TOKEN = botEnvConfig.TELEGRAM_BOT_TOKEN
        }
    }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curatekids'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Check CLI args
const isDryRun = process.argv.includes('--dry-run')

interface Organization {
    _id: any
    name: string
    telegramGroupId: string
    ownerTelegramId?: string
}

/**
 * Check if bot is still a member of the Telegram group
 */
async function isBotMemberOfGroup(groupId: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('⚠️  TELEGRAM_BOT_TOKEN not found. Skipping Telegram API checks.')
        return true // Assume bot is member if we can't check
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${groupId}`
        )

        if (!response.ok) {
            const error = await response.json()
            // Common error codes for deleted/inaccessible groups:
            // 400: Bad Request (group doesn't exist or bot was removed)
            // 403: Forbidden (bot was kicked)
            if (response.status === 400 || response.status === 403) {
                return false
            }
            console.warn(`  ⚠️  Unexpected API error for group ${groupId}:`, error)
            return true // Don't delete on unknown errors
        }

        const data = await response.json()
        return data.ok === true
    } catch (error) {
        console.error(`  ❌ Error checking group ${groupId}:`, error)
        return true // Don't delete on network errors
    }
}

async function cleanupOrphanedOrganizations() {
    console.log('🧹 Starting orphaned organizations cleanup...')
    console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will delete orphaned orgs)'}`)
    console.log(`   MongoDB: ${MONGODB_URI}`)
    console.log(`   TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? '✅ Found' : '❌ Not found'}`)
    console.log('')

    const client = new MongoClient(MONGODB_URI)

    try {
        await client.connect()
        console.log('✅ Connected to MongoDB')

        const db = client.db()
        const orgsCollection = db.collection('organizations')
        const usersCollection = db.collection('users')

        // Get all organizations
        const organizations = await orgsCollection.find({}).toArray() as Organization[]
        console.log(`📊 Found ${organizations.length} total organizations`)
        console.log('')

        if (organizations.length === 0) {
            console.log('✨ No organizations found. Nothing to clean up.')
            return
        }

        const orphanedOrgs: Organization[] = []

        // Check each organization
        for (const org of organizations) {
            if (!org.telegramGroupId) {
                console.log(`  ⏭️  Skipping "${org.name}" - no Telegram group ID`)
                continue
            }

            console.log(`  🔍 Checking "${org.name}" (Group ID: ${org.telegramGroupId})...`)

            const isMember = await isBotMemberOfGroup(org.telegramGroupId)

            if (!isMember) {
                console.log(`     ❌ Bot is not a member (group likely deleted or bot removed)`)
                orphanedOrgs.push(org)
            } else {
                console.log(`     ✅ Bot is still a member`)
            }
        }

        console.log('')
        console.log(`📋 Summary:`)
        console.log(`   Total organizations: ${organizations.length}`)
        console.log(`   Active organizations: ${organizations.length - orphanedOrgs.length}`)
        console.log(`   Orphaned organizations: ${orphanedOrgs.length}`)
        console.log('')

        if (orphanedOrgs.length === 0) {
            console.log('✨ No orphaned organizations found!')
            return
        }

        console.log('🗑️  Organizations to be removed:')
        orphanedOrgs.forEach((org, index) => {
            console.log(`   ${index + 1}. "${org.name}" (Group ID: ${org.telegramGroupId})`)
        })
        console.log('')

        if (isDryRun) {
            console.log('🔒 DRY RUN MODE - No changes made')
            console.log('   Run without --dry-run to actually delete these organizations')
            return
        }

        // Delete orphaned organizations
        console.log('🗑️  Deleting orphaned organizations...')

        for (const org of orphanedOrgs) {
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
            console.log(`   ✅ Deleted organization "${org.name}"`)
        }

        console.log('')
        console.log(`✅ Cleanup complete! Removed ${orphanedOrgs.length} orphaned organization(s)`)

    } catch (error) {
        console.error('❌ Error during cleanup:', error)
        process.exit(1)
    } finally {
        await client.close()
        console.log('')
        console.log('👋 Disconnected from MongoDB')
    }
}

cleanupOrphanedOrganizations()
