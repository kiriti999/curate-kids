/**
 * Fix Database Leftovers Script
 *
 * Cleans up three leftovers from earlier schema/test runs:
 *   1. users.telegramId_1 is a unique index that isn't sparse, and some users
 *      store telegramId: null, so a second unlinked user fails with E11000.
 *      -> unset null telegramId values and recreate the index as unique + sparse.
 *   2. organizations.slug_1 is an unused unique index (the schema has no slug).
 *      -> dropped.
 *   3. An orphaned test organization left behind by a failed delete.
 *      -> removed, but only if no user or video references it.
 *
 * Dry run by default. Nothing changes without --apply.
 *
 * Usage:
 *   pnpm fix:db-leftovers            # show what would change
 *   pnpm fix:db-leftovers --apply    # make the changes
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'

// Same orphan the bot logged when its delete failed
const ORPHAN_ORG_ID = '6ae9be1ccc49df7ba54c54a0'
const ORPHAN_ORG_NAME = 'Vrindha & CuratedReels'

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

const apply = process.argv.includes('--apply')

async function main() {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set')
    const client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    try {
        const db = client.db('curatedreels')
        const users = db.collection('users')
        const orgs = db.collection('organizations')
        const mode = apply ? 'APPLY' : 'DRY RUN'
        console.log(`\n=== ${mode} ===\n`)

        // --- 1. users.telegramId
        const idx = (await users.indexes()).find((i) => i.name === 'telegramId_1')
        console.log('users.telegramId_1:', idx ? JSON.stringify({ unique: idx.unique, sparse: idx.sparse }) : 'missing')
        const nullCount = await users.countDocuments({ telegramId: null, $expr: { $ne: [{ $type: '$telegramId' }, 'missing'] } })
        console.log(`users with telegramId explicitly null/empty: ${nullCount}`)
        const needsIndexFix = !idx || !idx.unique || !idx.sparse
        if (apply) {
            if (nullCount > 0) {
                await users.updateMany({ telegramId: null, $expr: { $ne: [{ $type: '$telegramId' }, 'missing'] } }, { $unset: { telegramId: '' } })
                console.log('  -> unset null telegramId values')
            }
            if (needsIndexFix) {
                if (idx) await users.dropIndex('telegramId_1')
                await users.createIndex({ telegramId: 1 }, { name: 'telegramId_1', unique: true, sparse: true })
                console.log('  -> recreated telegramId_1 as unique + sparse')
            }
        }

        // --- 2. organizations.slug_1
        const slugIdx = (await orgs.indexes()).find((i) => i.name === 'slug_1')
        console.log(`\norganizations.slug_1: ${slugIdx ? 'present (unused)' : 'not present'}`)
        if (apply && slugIdx) {
            await orgs.dropIndex('slug_1')
            console.log('  -> dropped slug_1')
        }

        // --- 3. orphan organization
        const orphan = await orgs.findOne({ _id: new ObjectId(ORPHAN_ORG_ID) })
        if (!orphan) {
            console.log('\norphan organization: already gone')
        } else {
            const userRefs = await users.countDocuments({ organization: orphan._id })
            const videoRefs = await db.collection('videos').countDocuments({ organization: orphan._id })
            console.log(`\norphan organization: "${orphan.name}" (${orphan.telegramGroupId}); users: ${userRefs}, videos: ${videoRefs}`)
            if (orphan.name !== ORPHAN_ORG_NAME) {
                console.log('  -> name differs from the expected test org; leaving it alone')
            } else if (userRefs > 0 || videoRefs > 0) {
                console.log('  -> still referenced; leaving it alone')
            } else if (apply) {
                await orgs.deleteOne({ _id: orphan._id })
                console.log('  -> deleted')
            }
        }

        if (!apply) console.log('\nDry run only. Re-run with --apply to make these changes.')
    } finally {
        await client.close()
    }
}

main().catch((err) => {
    console.error('❌', err instanceof Error ? err.message : err)
    process.exit(1)
})
