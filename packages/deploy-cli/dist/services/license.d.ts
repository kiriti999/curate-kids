/**
 * License Verification Service
 *
 * Verifies customer license keys with Lambda Function URLs
 */
export interface License {
    key: string;
    customerId: string;
    customerEmail: string;
    tier: 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'expired' | 'suspended';
    expiresAt: string;
    maxDeployments: number;
    currentDeployments: number;
    features: string[];
}
/**
 * Verify license key with Lambda
 */
export declare function verifyLicense(licenseKey: string): Promise<boolean>;
/**
 * Get license details
 */
export declare function getLicenseDetails(licenseKey: string): Promise<License>;
/**
 * Register a new deployment
 */
export declare function registerDeployment(licenseKey: string, deploymentInfo: {
    projectName: string;
    frontendUrl: string;
    cmsUrl: string;
    botUrl: string;
}): Promise<void>;
/**
 * For development/testing: Mock license verification
 * Remove this in production
 */
export declare function mockVerifyLicense(licenseKey: string): Promise<boolean>;
//# sourceMappingURL=license.d.ts.map