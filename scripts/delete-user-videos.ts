/**
 * Delete Videos Script
 *
 * Deletes videos submitted by a user (matched by email), or every video with --all-videos.
 * Dry run by default: it only lists what would be deleted. Nothing is removed without --confirm.
 * Also removes the deleted videos from any playlists.
 *
 * Usage:
 *   pnpm delete:videos you@example.com                 # list videos submitted by this user
 *   pnpm delete:videos you@example.com --confirm       # delete them
 *   pnpm delete:videos you@example.com --all-videos    # list EVERY video in the library
 *   pnpm delete:videos you@example.com --all-videos --confirm
 *
 * Note: videos uploaded via Telegram keep their files in Cloudinary; this only
 * deletes the database records.
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

// Fall back to the bot's or Vercel's env file if MONGODB_URI isn't set in the shell/.env
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

const MONGODB_URI = process.env.MONGODB_URI
const args = process.argv.slice(2)
const email = args.find((a) => !a.startsWith('--'))
const allVideos = args.includes('--all-videos')
const confirm = args.includes('--confirm')

async function main() {
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not set')
    if (!email) throw new Error('Usage: pnpm delete:videos <email> [--all-videos] [--confirm]')

    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    try {
        const db = client.db('curatedreels')

        const user = await db.collection('users').findOne({ email: email.toLowerCase() })
        if (!user) throw new Error(`No user found with email ${email}`)
        console.log(`User: ${user.email} (${user.role}) id=${user._id}`)

        const filter = allVideos ? {} : { submittedBy: user._id }
        const videos = await db
            .collection('videos')
            .find(filter, { projection: { title: 1, source: 1, status: 1 } })
            .sort({ createdAt: -1 })
            .toArray()

        console.log(
            `\n${allVideos ? 'ALL videos in the library' : `Videos submitted by ${user.email}`}: ${videos.length}\n`,
        )
        videos.forEach((v, i) =>
            console.log(`${String(i + 1).padStart(3)}. [${v.status}] [${v.source}] ${v.title}`),
        )

        if (videos.length === 0) return
        if (!confirm) {
            console.log('\nDry run only. Re-run with --confirm to delete these videos.')
            return
        }

        const ids = videos.map((v) => v._id)
        const del = await db.collection('videos').deleteMany({ _id: { $in: ids } })
        const pl = await db
            .collection('playlists')
            .updateMany({ 'items.video': { $in: ids } }, { $pull: { items: { video: { $in: ids } } } } as never)
        console.log(`\n🗑  Deleted ${del.deletedCount} videos; cleaned ${pl.modifiedCount} playlists.`)
    } finally {
        await client.close()
    }
}

main().catch((err) => {
    console.error('❌', err instanceof Error ? err.message : err)
    process.exit(1)
})
