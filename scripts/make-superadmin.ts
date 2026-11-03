/**
 * Make Super Admin Script
 *
 * Sets a user's role to "superadmin" so they see and manage everything,
 * regardless of which organization they belong to. Needed because only platform
 * admins can change roles, so an org-attached admin can't promote themselves
 * from the admin panel.
 *
 * Dry run by default. Nothing changes without --apply.
 *
 * Usage:
 *   pnpm make:superadmin you@example.com            # show what would change
 *   pnpm make:superadmin you@example.com --apply    # set role to superadmin
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
    for (const file of ['bot/.env', '.env.vercel']) {
        const p = path.resolve(process.cwd(), file)
        if (fs.existsSync(p)) {
            const uri = dotenv.parse(fs.readFileSync(p)).MONGODB_URI
            if (uri) {
                process.env.MONGODB_URI = uri
                console.log(`Using MONGODB_URI from ${file}`)
                break
            }
        }
    }
}

const email = process.argv.slice(2).find((a) => !a.startsWith('--'))
const apply = process.argv.includes('--apply')

async function main() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set')
    if (!email) throw new Error('Usage: pnpm make:superadmin <email> [--apply]')

    const client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    try {
        const users = client.db('curatedreels').collection('users')
        const user = await users.findOne({ email: email.toLowerCase() })
        if (!user) throw new Error(`No user found with email ${email}`)

        console.log(`User: ${user.email} | role: ${user.role} | organization: ${user.organization ?? 'none'}`)
        if (user.role === 'superadmin') {
            console.log('Already a super admin. Nothing to do.')
            return
        }
        if (!apply) {
            console.log(`\nDry run: would change role "${user.role}" -> "superadmin". Re-run with --apply.`)
            return
        }
        await users.updateOne({ _id: user._id }, { $set: { role: 'superadmin', updatedAt: new Date() } })
        console.log('✅ Role set to superadmin. Log out and back in to refresh your session.')
    } finally {
        await client.close()
    }
}

main().catch((err) => {
    console.error('❌', err instanceof Error ? err.message : err)
    process.exit(1)
})
