/**
 * MongoDB Database Service
 * 
 * Handles connection and operations for license management
 */

import { MongoClient, Db, Collection } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export interface License {
    _id?: string
    key: string
    customerId: string
    customerName: string
    customerEmail: string
    tier: 'starter' | 'pro' | 'enterprise'
    status: 'active' | 'expired' | 'suspended'
    maxDeployments: number
    createdAt: Date
    expiresAt: Date | null
    metadata?: Record<string, any>
}

export interface Deployment {
    _id?: string
    licenseKey: string
    projectName: string
    frontendUrl: string
    cmsUrl: string
    botUrl: string
    deployedAt: Date
    status: 'active' | 'deleted'
}

const MONGODB_URI = process.env.CURATEDREELS_ADMIN_MONGODB_URI || 
                    process.env.MONGODB_URI ||
                    'mongodb://localhost:27017/curatedreels-licenses'

/**
 * Connect to MongoDB
 */
export async function connect(): Promise<Db> {
    if (db) return db

    client = new MongoClient(MONGODB_URI)
    await client.connect()
    db = client.db()
    
    // Debug: log the actual database name being used
    console.log('[DEBUG] Admin CLI connected to database:', db.databaseName)
    
    // Create indexes
    await db.collection('licenses').createIndex({ key: 1 }, { unique: true })
    await db.collection('licenses').createIndex({ customerId: 1 })
    await db.collection('licenses').createIndex({ customerEmail: 1 })
    await db.collection('deployments').createIndex({ licenseKey: 1 })
    
    return db
}

/**
 * Disconnect from MongoDB
 */
export async function disconnect(): Promise<void> {
    if (client) {
        await client.close()
        client = null
        db = null
    }
}

/**
 * Get licenses collection
 */
export function getLicensesCollection(): Collection<License> {
    if (!db) throw new Error('Database not connected')
    return db.collection<License>('licenses')
}

/**
 * Get deployments collection
 */
export function getDeploymentsCollection(): Collection<Deployment> {
    if (!db) throw new Error('Database not connected')
    return db.collection<Deployment>('deployments')
}
