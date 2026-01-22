/**
 * Razorpay Webhook Handler Lambda
 * Handles subscription events from Razorpay (via whatsnxt.in)
 */

const { connectToDatabase } = require('./shared/db');
const crypto = require('crypto');

// License key generation
function generateLicenseKey() {
    const prefix = 'ck';
    const random = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${random}`;
}

// Determine tier from Razorpay plan
function getTierFromPlan(planId) {
    if (planId.includes('starter')) return 'starter';
    if (planId.includes('pro')) return 'pro';
    if (planId.includes('enterprise')) return 'enterprise';
    return 'starter'; // default
}

// Get max deployments based on tier
function getMaxDeployments(tier) {
    switch (tier) {
        case 'starter': return 1;
        case 'pro': return 3;
        case 'enterprise': return 999;
        default: return 1;
    }
}

// Verify Razorpay webhook signature
function verifyWebhookSignature(body, signature, secret) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
}

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        // Verify webhook signature
        const razorpaySignature = event.headers['X-Razorpay-Signature'] || event.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!razorpaySignature || !webhookSecret) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        const isValid = verifyWebhookSignature(
            event.body,
            razorpaySignature,
            webhookSecret
        );

        if (!isValid) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid signature' }),
            };
        }

        // Parse webhook event
        const webhookEvent = JSON.parse(event.body);
        const eventType = webhookEvent.event;

        // Connect to MongoDB
        const { db } = await connectToDatabase();

        // Handle one-time payment (payment.captured)
        if (eventType === 'payment.captured') {
            const payment = webhookEvent.payload.payment.entity;

            // Check if license already exists for this payment
            const existingLicense = await db.collection('licenses').findOne({ razorpayPaymentId: payment.id });
            if (existingLicense) {
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'License already exists' }) };
            }

            // Determine tier from notes or amount
            // Default to 'starter' if not specified
            let tier = 'starter';
            if (payment.notes && payment.notes.tier) {
                tier = payment.notes.tier;
            } else if (payment.amount >= 1000000) { // Example: > 10,000 INR
                tier = 'enterprise';
            } else if (payment.amount >= 500000) { // Example: > 5,000 INR
                tier = 'pro';
            }

            const licenseKey = generateLicenseKey();
            const createdAt = new Date();
            // Lifetime license (100 years)
            const expiresAt = new Date(createdAt);
            expiresAt.setFullYear(expiresAt.getFullYear() + 100);

            await db.collection('licenses').insertOne({
                licenseKey,
                customerId: payment.customer_id || 'guest',
                email: payment.email || payment.notes?.email,
                tier,
                status: 'active',
                expiresAt,
                maxDeployments: getMaxDeployments(tier),
                currentDeployments: 0,
                razorpayPaymentId: payment.id,
                paymentAmount: payment.amount,
                createdAt,
                updatedAt: createdAt,
                type: 'lifetime'
            });

            console.log('Lifetime license created:', licenseKey, 'for', payment.email);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, licenseKey }),
            };
        }

        // Handle subscription activated
        if (eventType === 'subscription.activated') {
            const subscription = webhookEvent.payload.subscription.entity;

            const licenseKey = generateLicenseKey();
            const tier = getTierFromPlan(subscription.plan_id);

            await db.collection('licenses').insertOne({
                licenseKey,
                customerId: subscription.customer_id,
                email: subscription.customer_email || subscription.notes?.email,
                tier,
                status: 'active',
                expiresAt: new Date(subscription.current_end * 1000),
                maxDeployments: getMaxDeployments(tier),
                currentDeployments: 0,
                razorpaySubscriptionId: subscription.id,
                razorpayCustomerId: subscription.customer_id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            console.log('License created:', licenseKey, 'for', subscription.customer_email);

            // TODO: Send email with license key
            // await sendEmail({
            //   to: subscription.customer_email,
            //   subject: 'Your CuratedReels License Key',
            //   body: `Your license key: ${licenseKey}`
            // });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, licenseKey }),
            };
        }

        // Handle subscription charged (renewal)
        if (eventType === 'subscription.charged') {
            const subscription = webhookEvent.payload.subscription.entity;

            await db.collection('licenses').updateOne(
                { razorpaySubscriptionId: subscription.id },
                {
                    $set: {
                        status: 'active',
                        expiresAt: new Date(subscription.current_end * 1000),
                        updatedAt: new Date(),
                    },
                }
            );

            console.log('License renewed:', subscription.id);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true }),
            };
        }

        // Handle subscription cancelled/paused
        if (eventType === 'subscription.cancelled' || eventType === 'subscription.paused') {
            const subscription = webhookEvent.payload.subscription.entity;

            await db.collection('licenses').updateOne(
                { razorpaySubscriptionId: subscription.id },
                {
                    $set: {
                        status: eventType === 'subscription.cancelled' ? 'cancelled' : 'paused',
                        updatedAt: new Date(),
                    },
                }
            );

            console.log('License status updated:', subscription.id, eventType);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true }),
            };
        }

        // Unhandled event type
        console.log('Unhandled event type:', eventType);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Event ignored' }),
        };

    } catch (error) {
        console.error('Error handling webhook:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
