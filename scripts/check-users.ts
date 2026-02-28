import { getPayload } from 'payload'
import config from '../payload.config'

async function checkTokens() {
    const payload = await getPayload({ config })

    const users = await payload.find({
        collection: 'users',
        showHiddenFields: true,
        limit: 100,
    })

    const now = new Date()
    for (const doc of users.docs) {
        const expiry = (doc as any).resetPasswordExpiration
        console.log(`Email: ${doc.email}`)
        console.log(`Token in DB: "${(doc as any).resetPasswordToken}"`)
        console.log(`Token Expiry: ${expiry}`)
        console.log(`Now: ${now.toISOString()}`)
        if (expiry) {
            const expiryDate = new Date(expiry)
            console.log(`Token expired? ${expiryDate < now ? 'YES - EXPIRED' : 'No - still valid'}`)
        }
    }

    process.exit(0)
}

checkTokens().catch(console.error)
