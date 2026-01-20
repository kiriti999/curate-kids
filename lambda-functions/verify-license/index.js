/**
 * License Verification Lambda
 * Verifies if a license key is valid and active
 */

const { connectToDatabase } = require('./shared/db');

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { key: licenseKey } = body;

        if (!licenseKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'License key is required' }),
            };
        }

        // Connect to MongoDB
        const { db } = await connectToDatabase();

        // Find license
        const license = await db.collection('licenses').findOne({
            licenseKey,
            status: 'active'
        });

        // License not found
        if (!license) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    valid: false,
                    error: 'Invalid or inactive license key'
                }),
            };
        }

        // Check expiration
        if (new Date(license.expiresAt) < new Date()) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    valid: false,
                    error: 'License has expired'
                }),
            };
        }

        // Check deployment limit
        if (license.currentDeployments >= license.maxDeployments) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    valid: false,
                    error: `Deployment limit reached (${license.maxDeployments} max)`,
                    currentDeployments: license.currentDeployments,
                    maxDeployments: license.maxDeployments
                }),
            };
        }

        // Valid license
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: true,
                tier: license.tier,
                customerId: license.customerId,
                email: license.email,
                currentDeployments: license.currentDeployments,
                maxDeployments: license.maxDeployments,
                expiresAt: license.expiresAt,
            }),
        };

    } catch (error) {
        console.error('Error verifying license:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                valid: false,
                error: 'Internal server error'
            }),
        };
    }
};
