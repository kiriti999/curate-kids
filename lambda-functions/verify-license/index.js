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
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { key } = body;

        if (!key) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'License key is required' }),
            };
        }

        // Connect to MongoDB
        const { db } = await connectToDatabase();

        console.log('Looking for license with key:', key);

        // Find license by key field
        const license = await db.collection('licenses').findOne({ key });
        
        console.log('License found:', license ? 'YES' : 'NO');

        // License not found
        if (!license) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    valid: false,
                    error: 'Invalid license key'
                }),
            };
        }

        // Check status
        if (license.status === 'suspended') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    valid: false,
                    error: 'License has been suspended'
                }),
            };
        }

        // Check expiration
        if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
            // Auto-update status to expired
            await db.collection('licenses').updateOne(
                { key },
                { $set: { status: 'expired' } }
            );
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    valid: false,
                    error: 'License has expired'
                }),
            };
        }

        // Count current deployments
        const currentDeployments = await db.collection('deployments').countDocuments({
            licenseKey: key,
            status: 'active'
        });

        // Check deployment limit
        if (currentDeployments >= license.maxDeployments) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    valid: false,
                    error: `Deployment limit reached (${license.maxDeployments} max for ${license.tier} tier)`,
                    currentDeployments,
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
                email: license.customerEmail,
                currentDeployments,
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
