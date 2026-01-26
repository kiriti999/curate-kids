/**
 * Bot Leave Groups Script
 * 
 * Makes the bot leave specified Telegram groups, which triggers automatic
 * cleanup in the CMS via the my_chat_member event handler.
 * 
 * Usage: pnpm bot:leave-groups
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

// Load bot token
if (!process.env.TELEGRAM_BOT_TOKEN) {
    const botEnvLocalPath = path.resolve(process.cwd(), '../curatedreels-bot/.env.local')
    if (fs.existsSync(botEnvLocalPath)) {
        const botEnvConfig = dotenv.parse(fs.readFileSync(botEnvLocalPath))
        if (botEnvConfig.TELEGRAM_BOT_TOKEN) {
            process.env.TELEGRAM_BOT_TOKEN = botEnvConfig.TELEGRAM_BOT_TOKEN
        }
    }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/curatedreels'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface Organization {
    _id: any
    name: string
    telegramGroupId: string
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

async function leaveGroup(groupId: string): Promise<{ success: boolean; message: string }> {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, message: 'TELEGRAM_BOT_TOKEN not found' }
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/leaveChat?chat_id=${groupId}`,
            { method: 'POST' }
        )

        const data = await response.json()

        if (data.ok) {
            return { success: true, message: 'Bot left the group successfully' }
        } else {
            return { success: false, message: data.description || 'Unknown error' }
        }
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : String(error) }
    }
}

async function botLeaveGroups() {
    console.log('🤖 Bot Leave Groups Script')
    console.log(`   MongoDB: ${MONGODB_URI}`)
    console.log(`   TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? '✅ Found' : '❌ Not found'}`)
    console.log('')

    if (!TELEGRAM_BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN is required. Exiting.')
        process.exit(1)
    }

    const client = new MongoClient(MONGODB_URI)

    try {
        await client.connect()
        console.log('✅ Connected to MongoDB\n')

        const db = client.db()
        const orgsCollection = db.collection('organizations')

        // Get all organizations
        const organizations = await orgsCollection.find({}).sort({ createdAt: -1 }).toArray() as Organization[]

        if (organizations.length === 0) {
            console.log('✨ No organizations found.')
            return
        }

        console.log(`📋 Found ${organizations.length} groups:\n`)
        organizations.forEach((org, index) => {
            const date = new Date(org.createdAt).toLocaleString()
            console.log(`${index + 1}. "${org.name}"`)
            console.log(`   Group ID: ${org.telegramGroupId}`)
            console.log(`   Created: ${date}`)
            console.log('')
        })

        const choice = await askQuestion('Which groups should the bot leave? (enter numbers separated by commas, e.g., "1,2,3" or "all" for all groups, or "none" to exit): ')

        if (choice.toLowerCase() === 'none') {
            console.log('\n✨ No changes made. Exiting.')
            return
        }

        let groupsToLeave: Organization[]

        if (choice.toLowerCase() === 'all') {
            groupsToLeave = organizations
        } else {
            const indices = choice.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < organizations.length)

            if (indices.length === 0) {
                console.log('\n❌ No valid indices provided. Exiting.')
                return
            }

            groupsToLeave = indices.map(i => organizations[i])
        }

        console.log(`\n📊 Summary:`)
        console.log(`   Bot will leave ${groupsToLeave.length} group(s)\n`)

        console.log('🚪 Groups to leave:')
        groupsToLeave.forEach((org, index) => {
            console.log(`   ${index + 1}. "${org.name}" (${org.telegramGroupId})`)
        })
        console.log('')

        const confirm = await askQuestion('⚠️  This will trigger automatic cleanup in the CMS. Continue? (yes/no): ')

        if (confirm.toLowerCase() !== 'yes') {
            console.log('\n❌ Cancelled. No changes made.')
            return
        }

        console.log('\n🚪 Making bot leave groups...\n')

        let successCount = 0
        let failCount = 0

        for (const org of groupsToLeave) {
            console.log(`   Leaving "${org.name}" (${org.telegramGroupId})...`)
            const result = await leaveGroup(org.telegramGroupId)

            if (result.success) {
                console.log(`   ✅ ${result.message}`)
                successCount++
            } else {
                console.log(`   ❌ Failed: ${result.message}`)
                failCount++
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        console.log(`\n📊 Results:`)
        console.log(`   ✅ Successfully left: ${successCount} group(s)`)
        console.log(`   ❌ Failed: ${failCount} group(s)`)
        console.log('')
        console.log('ℹ️  Note: The organizations will be automatically deleted from the CMS')
        console.log('   by the bot\'s my_chat_member event handler (may take a few moments).')

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    } finally {
        await client.close()
        console.log('\n👋 Disconnected from MongoDB')
    }
}

botLeaveGroups()
