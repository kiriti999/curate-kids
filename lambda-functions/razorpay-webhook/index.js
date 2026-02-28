/**
 * Razorpay Webhook Handler Lambda
 * Handles subscription events from Razorpay (via whatsnxt.in)
 */

const { connectToDatabase } = require('./shared/db');
const { sendCustomerLicenseEmail, sendCompanyOrderNotification } = require('./shared/email');
const crypto = require('crypto');

// License key generation
function generateLicenseKey() {
    const prefix = 'ck';
    const random = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${random}`;
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
            if (payment.notes?.tier) {
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
                key: licenseKey,
                customerId: payment.customer_id || 'guest',
                customerName: payment.notes?.name,
                customerEmail: payment.email || payment.notes?.email,
                tier,
                status: 'active',
                expiresAt,
                maxDeployments: getMaxDeployments(tier),
                currentDeployments: 0,
                razorpayPaymentId: payment.id,
                paymentAmount: payment.amount,
                createdAt,
                updatedAt: createdAt,
                metadata: {},
                type: 'lifetime'
            });

            const customerEmail = payment.email || payment.notes?.email;
            const customerName = payment.notes?.name;
            const maxDeployments = getMaxDeployments(tier);

            console.log('Lifetime license created:', licenseKey, 'for', customerEmail);

            // Send emails
            if (customerEmail) {
                await Promise.all([
                    sendCustomerLicenseEmail({
                        email: customerEmail,
                        name: customerName,
                        licenseKey,
                        tier,
                        maxDeployments
                    }),
                    sendCompanyOrderNotification({
                        email: customerEmail,
                        name: customerName,
                        licenseKey,
                        tier,
                        amount: payment.amount
                    })
                ]);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, licenseKey }),
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
