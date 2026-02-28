import { getPayload } from 'payload'
import config from '../payload.config'

async function reset() {
    const payload = await getPayload({ config })

    const users = await payload.find({
        collection: 'users',
        where: { email: { equals: 'kiriti.k999@gmail.com' } },
        limit: 1,
    })

    if (users.docs.length > 0) {
        const user = users.docs[0]
        await payload.update({
            collection: 'users',
            id: user.id,
            data: {
                password: 'Password@123',
            },
        })
        console.log('Password reset successfully to Password@123')
    } else {
        console.log('User not found')
    }

    process.exit(0)
}

reset().catch(console.error)
