/**
 * License Verification Service
 * 
 * Verifies customer license keys with CurateKids license server
 */

import fetch from 'node-fetch'

const LICENSE_API_URL = process.env.LICENSE_API_URL || 'https://api.curatekids.com/v1/licenses'

export interface License {
    key: string
    customerId: string
    customerEmail: string
    tier: 'starter' | 'pro' | 'enterprise'
    status: 'active' | 'expired' | 'suspended'
    expiresAt: string
    maxDeployments: number
    currentDeployments: number
    features: string[]
}

/**
 * Verify license key with license server
 */
export async function verifyLicense(licenseKey: string): Promise<boolean> {
    try {
        const response = await fetch(`${LICENSE_API_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'curatekids-deploy/1.0.0'
            },
            body: JSON.stringify({ key: licenseKey })
        })

        if (!response.ok) {
            if (response.status === 401) {
                return false // Invalid license
            }
            throw new Error(`License verification failed: ${response.statusText}`)
        }

        const license: License = await response.json() as License

        // Check if license is active
        if (license.status !== 'active') {
            throw new Error(`License is ${license.status}`)
        }

        // Check if license is expired
        if (new Date(license.expiresAt) < new Date()) {
            throw new Error('License has expired')
        }

        // Check deployment limits
        if (license.currentDeployments >= license.maxDeployments) {
            throw new Error(`Deployment limit reached (${license.maxDeployments} max)`)
        }

        return true
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Failed to verify license')
    }
}

/**
 * Get license details
 */
export async function getLicenseDetails(licenseKey: string): Promise<License> {
    const response = await fetch(`${LICENSE_API_URL}/details`, {
        method: 'GET',
        headers: {
            'Authorization': `License ${licenseKey}`,
            'User-Agent': 'curatekids-deploy/1.0.0'
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to get license details: ${response.statusText}`)
    }

    return await response.json() as License
}

/**
 * Register a new deployment
 */
export async function registerDeployment(
    licenseKey: string,
    deploymentInfo: {
        projectName: string
        frontendUrl: string
        cmsUrl: string
        botUrl: string
    }
): Promise<void> {
    const response = await fetch(`${LICENSE_API_URL}/deployments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `License ${licenseKey}`,
            'User-Agent': 'curatekids-deploy/1.0.0'
        },
        body: JSON.stringify(deploymentInfo)
    })

    if (!response.ok) {
        throw new Error(`Failed to register deployment: ${response.statusText}`)
    }
}

/**
 * For development/testing: Mock license verification
 * Remove this in production
 */
export async function mockVerifyLicense(licenseKey: string): Promise<boolean> {
    // Development bypass for testing
    if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Using mock license verification (development mode)')
        return licenseKey.startsWith('test_') || licenseKey.startsWith('dev_')
    }

    return verifyLicense(licenseKey)
}
