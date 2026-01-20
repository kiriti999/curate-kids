/**
 * License Verification Service
 * 
 * Verifies customer license keys with Lambda Function URLs
 */

import fetch from 'node-fetch'

// Lambda Function URLs (set after deployment)
const VERIFY_URL = process.env.VERIFY_LICENSE_URL || 'https://qr4uign67ucohx2dogu2xq7neq0rjonz.lambda-url.ap-south-1.on.aws'
const REGISTER_URL = process.env.REGISTER_DEPLOYMENT_URL || 'https://e3ukc7oeybqvsf27dhrsug25my0psezs.lambda-url.ap-south-1.on.aws'

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
 * Verify license key with Lambda
 */
export async function verifyLicense(licenseKey: string): Promise<boolean> {
    try {
        const response = await fetch(VERIFY_URL, {
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

        const result: any = await response.json()

        if (!result.valid) {
            throw new Error(result.error || 'Invalid license')
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
    const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'curatekids-deploy/1.0.0'
        },
        body: JSON.stringify({ key: licenseKey })
    })

    if (!response.ok) {
        throw new Error(`Failed to get license details: ${response.statusText}`)
    }

    const result: any = await response.json()

    if (!result.valid) {
        throw new Error(result.error || 'Invalid license')
    }

    return {
        key: licenseKey,
        customerId: result.customerId,
        customerEmail: result.email,
        tier: result.tier,
        status: 'active',
        expiresAt: result.expiresAt,
        maxDeployments: result.maxDeployments,
        currentDeployments: result.currentDeployments,
        features: []
    }
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
    const response = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `License ${licenseKey}`,
            'User-Agent': 'curatekids-deploy/1.0.0'
        },
        body: JSON.stringify(deploymentInfo)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to register deployment: ${error}`)
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
        return licenseKey.startsWith('test_') || licenseKey.startsWith('dev_') || licenseKey.startsWith('ck_')
    }

    return verifyLicense(licenseKey)
}
