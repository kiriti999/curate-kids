/**
 * Register Deployment Lambda
 * Records a new deployment and increments the counter
 */

const { connectToDatabase } = require('./shared/db');

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Parse authorization header
        const authHeader = event.headers.Authorization || event.headers.authorization;
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
        const license = await db.collection('licenses').findOne({
            licenseKey,
            status: 'active',
        });

        if (!license) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid license key' }),
            };
        }

        // Check deployment limit
        if (license.currentDeployments >= license.maxDeployments) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    error: 'Deployment limit reached',
                    currentDeployments: license.currentDeployments,
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
            createdAt: new Date(),
            status: 'active',
        };

        await db.collection('deployments').insertOne(deployment);

        // Increment deployment counter
        await db.collection('licenses').updateOne(
            { licenseKey },
            {
                $inc: { currentDeployments: 1 },
                $set: { lastDeploymentAt: new Date() }
            }
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                deploymentId: deployment._id.toString(),
                currentDeployments: license.currentDeployments + 1,
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
