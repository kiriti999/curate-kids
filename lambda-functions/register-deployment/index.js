/**
 * Register Deployment Lambda
 * Records a new deployment against a license
 */

const { connectToDatabase } = require('./shared/db');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Parse authorization header
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('License ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Missing or invalid authorization' }),
            };
        }

        const licenseKey = authHeader.substring(8); // Remove "License " prefix

        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { projectName, frontendUrl, cmsUrl, botUrl } = body;

        if (!projectName || !frontendUrl || !cmsUrl || !botUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' }),
            };
        }

        // Connect to MongoDB
        const { db } = await connectToDatabase();

        // Verify license exists and is active
        const license = await db.collection('licenses').findOne({ key: licenseKey });

        if (!license) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid license key' }),
            };
        }

        if (license.status !== 'active') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: `License is ${license.status}` }),
            };
        }

        // Count current deployments
        const currentDeployments = await db.collection('deployments').countDocuments({
            licenseKey,
            status: 'active'
        });

        // Check deployment limit
        if (currentDeployments >= license.maxDeployments) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    error: `Deployment limit reached (${license.maxDeployments} max for ${license.tier} tier)`,
                    currentDeployments,
                    maxDeployments: license.maxDeployments
                }),
            };
        }

        // Record deployment
        const deployment = {
            licenseKey,
            customerId: license.customerId,
            projectName,
            frontendUrl,
            cmsUrl,
            botUrl,
            deployedAt: new Date(),
            status: 'active',
        };

        const result = await db.collection('deployments').insertOne(deployment);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                deploymentId: result.insertedId.toString(),
                currentDeployments: currentDeployments + 1,
                maxDeployments: license.maxDeployments,
            }),
        };

    } catch (error) {
        console.error('Error registering deployment:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
