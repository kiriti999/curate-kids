/**
 * License Service
 * 
 * CRUD operations for license management
 */

import { nanoid } from 'nanoid'
import { 
    connect, 
    disconnect,
    getLicensesCollection, 
    getDeploymentsCollection,
    License,
    Deployment
} from './database.js'

/**
 * Generate a new license key
 */
function generateLicenseKey(isTest = false): string {
    const prefix = isTest ? 'ck_test_' : 'ck_live_'
    return prefix + nanoid(32)
}

/**
 * Generate a customer ID
 */
function generateCustomerId(): string {
    return 'cust_' + nanoid(16)
}

/**
 * Create a new license
 */
export async function createLicense(options: {
    customerName: string
    customerEmail: string
    tier: 'starter' | 'pro' | 'enterprise'
    expiresInDays?: number
    isTest?: boolean
}): Promise<License> {
    await connect()
    const collection = getLicensesCollection()

    const maxDeployments = {
        starter: 1,
        pro: 5,
        enterprise: 999
    }[options.tier]

    const license: License = {
        key: generateLicenseKey(options.isTest),
        customerId: generateCustomerId(),
        customerName: options.customerName,
        customerEmail: options.customerEmail,
        tier: options.tier,
        status: 'active',
        maxDeployments,
        createdAt: new Date(),
        expiresAt: options.expiresInDays 
            ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
            : null,
        metadata: {}
    }

    await collection.insertOne(license)
    return license
}

/**
 * Get license by key
 */
export async function getLicense(key: string): Promise<License | null> {
    await connect()
    const collection = getLicensesCollection()
    return collection.findOne({ key })
}

/**
 * List all licenses
 */
export async function listLicenses(options?: {
    status?: 'active' | 'expired' | 'suspended'
    tier?: 'starter' | 'pro' | 'enterprise'
}): Promise<License[]> {
    await connect()
    const collection = getLicensesCollection()
    
    const filter: any = {}
    if (options?.status) filter.status = options.status
    if (options?.tier) filter.tier = options.tier

    return collection.find(filter).sort({ createdAt: -1 }).toArray()
}

/**
 * Update license status
 */
export async function updateLicenseStatus(
    key: string, 
    status: 'active' | 'expired' | 'suspended'
): Promise<boolean> {
    await connect()
    const collection = getLicensesCollection()
    
    const result = await collection.updateOne(
        { key },
        { $set: { status } }
    )
    
    return result.modifiedCount > 0
}

/**
 * Revoke (suspend) a license
 */
export async function revokeLicense(key: string): Promise<boolean> {
    return updateLicenseStatus(key, 'suspended')
}

/**
 * Delete a license (hard delete)
 */
export async function deleteLicense(key: string): Promise<boolean> {
    await connect()
    const collection = getLicensesCollection()
    
    const result = await collection.deleteOne({ key })
    return result.deletedCount > 0
}

/**
 * Verify a license key
 */
export async function verifyLicense(key: string): Promise<{
    valid: boolean
    error?: string
    license?: License
    currentDeployments?: number
}> {
    await connect()
    const license = await getLicense(key)

    if (!license) {
        return { valid: false, error: 'License not found' }
    }

    if (license.status === 'suspended') {
        return { valid: false, error: 'License has been suspended' }
    }

    if (license.status === 'expired') {
        return { valid: false, error: 'License has expired' }
    }

    if (license.expiresAt && new Date() > license.expiresAt) {
        // Auto-expire
        await updateLicenseStatus(key, 'expired')
        return { valid: false, error: 'License has expired' }
    }

    // Count current deployments
    const deploymentsCollection = getDeploymentsCollection()
    const currentDeployments = await deploymentsCollection.countDocuments({
        licenseKey: key,
        status: 'active'
    })

    return {
        valid: true,
        license,
        currentDeployments
    }
}

/**
 * Register a deployment
 */
export async function registerDeployment(
    licenseKey: string,
    deployment: {
        projectName: string
        frontendUrl: string
        cmsUrl: string
        botUrl: string
    }
): Promise<{ success: boolean; error?: string }> {
    await connect()
    
    // Verify license first
    const verification = await verifyLicense(licenseKey)
    
    if (!verification.valid) {
        return { success: false, error: verification.error }
    }

    const license = verification.license!
    const currentDeployments = verification.currentDeployments!

    // Check deployment limit
    if (currentDeployments >= license.maxDeployments) {
        return { 
            success: false, 
            error: `Deployment limit reached (${license.maxDeployments} max for ${license.tier} tier)` 
        }
    }

    // Register deployment
    const deploymentsCollection = getDeploymentsCollection()
    
    await deploymentsCollection.insertOne({
        licenseKey,
        projectName: deployment.projectName,
        frontendUrl: deployment.frontendUrl,
        cmsUrl: deployment.cmsUrl,
        botUrl: deployment.botUrl,
        deployedAt: new Date(),
        status: 'active'
    })

    return { success: true }
}

/**
 * List deployments for a license
 */
export async function listDeployments(licenseKey?: string): Promise<Deployment[]> {
    await connect()
    const collection = getDeploymentsCollection()
    
    const filter = licenseKey ? { licenseKey } : {}
    return collection.find(filter).sort({ deployedAt: -1 }).toArray()
}

/**
 * Get deployment stats
 */
export async function getStats(): Promise<{
    totalLicenses: number
    activeLicenses: number
    totalDeployments: number
    byTier: Record<string, number>
}> {
    await connect()
    const licensesCollection = getLicensesCollection()
    const deploymentsCollection = getDeploymentsCollection()

    const [totalLicenses, activeLicenses, totalDeployments, tierCounts] = await Promise.all([
        licensesCollection.countDocuments(),
        licensesCollection.countDocuments({ status: 'active' }),
        deploymentsCollection.countDocuments({ status: 'active' }),
        licensesCollection.aggregate([
            { $group: { _id: '$tier', count: { $sum: 1 } } }
        ]).toArray()
    ])

    const byTier: Record<string, number> = {}
    for (const t of tierCounts) {
        byTier[t._id] = t.count
    }

    return {
        totalLicenses,
        activeLicenses,
        totalDeployments,
        byTier
    }
}

export { disconnect }
